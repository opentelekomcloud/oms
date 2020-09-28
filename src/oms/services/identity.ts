import { AuthOptions, NameOrID } from '../core/types';
import Service, { bareUrl } from './base';
import HttpClient from '../core/http';

class identity {
    static methods = ['password']

    password!: {
        user: {
            id?: string
            name?: string
            password: string
            domain: NameOrID
        }
    }

    constructor(password: string, userID?: string, userName?: string, domainID?: string, domainName?: string) {
        this.password = {
            user: {
                id: userID,
                name: userName,
                password,
                domain: {
                    name: domainName,
                    id: domainID,
                },
            },
        }
    }
}

class authRequestData {
    [k: string]: unknown

    auth: {
        identity: identity
        scope?: {
            project?: NameOrID
            domain?: NameOrID
        }
    }

    constructor(credentials: AuthOptions) {
        if (!credentials.password) {
            throw 'Password has to be provided'
        }
        this.auth = {
            identity: new identity(
                credentials.password,
                undefined, credentials.username,
                credentials.domain_id,
                credentials.domain_name,
            ),
        }
        if (credentials.project_name || credentials.project_id) {
            this.auth.scope = {
                project: {
                    id: credentials.project_id,
                    name: credentials.project_name,
                },
            }
        } else {
            this.auth.scope = {
                domain: {
                    id: credentials.domain_id,
                    name: credentials.domain_name,
                },
            }
        }
    }
}

class serviceRef {
    name!: string
    type!: string
    links!: {
        next?: string
        previous?: string
        self: string
    }
    id!: string
    enabled!: boolean
}

class endpoint {
    id!: string
    service_id!: string
    region?: string
    links: unknown
    interface!: string
    url!: string
}

class version {
    id!: string
    links!: {
        rel: string
        href: string
    }[]
    status!: string
}

export default class IdentityV3 extends Service {
    static readonly type = 'identity'
    static readonly version = 'v3'

    constructor(url: string, httpClient: HttpClient) {
        super(bareUrl(url), httpClient)
    }

    /**
     * Get permanent auth token
     * @param credentials
     */
    async getToken(credentials: AuthOptions): Promise<string> {
        const data = new authRequestData(credentials)
        const resp = await this.client
            .post({ url: '/v3/auth/tokens', json: data })
            .catch(e => {
                console.log(JSON.stringify(e))
                throw e
            })
        const tok = resp.headers.get('X-Subject-Token')
        if (!tok) {
            throw 'No token provided as X-Subject-Token'
        }
        return tok
    }

    private endpoints: endpoint[] = []

    private serviceRefs: serviceRef[] = []

    async getServiceRefs(): Promise<serviceRef[]> {
        if (!this.endpoints.length) {
            const resp = await this.client
                .get<{ services: serviceRef[] }>({ url: '/v3/services' })
            this.serviceRefs = resp.data.services
        }
        return this.serviceRefs
    }

    async getEndpoints(): Promise<endpoint[]> {
        if (!this.endpoints.length) {
            const resp = await this.client
                .get<{ endpoints: endpoint[] }>({ url: '/v3/endpoints' })
            this.endpoints = resp.data.endpoints
        }
        return this.endpoints
    }

    async loadServiceEndpointCatalog(): Promise<void> {
        await Promise.all([
            this.getEndpoints(),
            this.getServiceRefs(),
        ])
    }

    async getServiceUrl(type: string, version: string | number, region: string, visibility = 'public'): Promise<string> {
        version = version.toString()
        if (!version.startsWith('v')) {
            version = `v${version}`
        }
        await this.loadServiceEndpointCatalog()
        const matchingService = this.serviceRefs.find(e => e.type == type)
        if (!matchingService) {
            throw `Service of type '${type}' not found`
        }
        const ep = this.endpoints.find(e => e.region == region
            && e.service_id == matchingService.id
            && e.interface == visibility)
        if (!ep) {
            throw `Endpoint for service: ${matchingService.name}, region: ${region}, interface: ${visibility} not found`
        }
        const url = bareUrl(ep.url)
        const fallbackUrl = `${url}/${version}`
        let vers: version[] = []
        try {
            const r = await this.client.get<{ versions: version[] }>({ url })
            vers = r.data.versions
        } catch (e) { // nice try, cowboy ;) openstack experience, hah?
            return fallbackUrl
        }
        const ver = vers
            .sort((a, b): number => statusPriority(a.status) - statusPriority(b.status))
            .find(v => v.id.startsWith(`${version}`))
        if (!ver) {
            console.debug(`Failed to find version of ${type} matching '${version}*', using ${fallbackUrl}`)
            return fallbackUrl
        }
        const link = ver.links.find(l => l.rel == 'self')
        if (!link || !link.href) {
            throw `Failed to find link to 'self' in ${JSON.stringify(ver.links)}`
        }
        return link.href
    }
}

/**
 * Calculate status priority, lower - better
 * @param status status string
 */
function statusPriority(status: string): number {
    switch (status.toLowerCase()) {
    case 'current':
        return 0
    case 'supported':
        return 10
    case 'deprecated':
        return 20
    default:
        return 100
    }
}
