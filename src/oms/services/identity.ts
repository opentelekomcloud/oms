import {AuthOptions, bareUrl, NameOrID, Service} from "../core/types";
import {AxiosInstance} from "axios";

class authRequestData {
    auth!: {
        identity: {
            methods: ["password"]
            password: {
                user: {
                    id?: string
                    name?: string
                    password: string
                    domain: NameOrID
                }
            }
        }
        scope?: {
            project?: NameOrID
            domain?: NameOrID
        }
    }

    constructor(credentials: AuthOptions) {
        this.auth.identity.password.user.name = credentials.username
        if (!credentials.password) {
            throw 'Password has to be provided'
        }
        this.auth.identity.password.user = {
            name: credentials.username,
            password: credentials.password,
            domain: {
                id: credentials.domain_id,
                name: credentials.domain_name
            }
        }
        if (credentials.project_name || credentials.project_id) {
            this.auth.scope = {
                project: {
                    id: credentials.project_id,
                    name: credentials.project_name,
                }
            }
        } else {
            this.auth.scope = {
                domain: {
                    id: credentials.domain_id,
                    name: credentials.domain_name,
                }
            }
        }
    }
}

class Token {
    token!: {
        user: object
        issued_at: string
        expires_at: string
        projects: object[]
        methods: string[]
        catalog: object[]
        roles: { id: string, name: string }[]
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
    region_id?: string
    region?: string
    links: any
    interface!: string
    url!: string
}

class version {
    id!: string
    links!: {
        rel: string
        href: string
    }[]
}

export class IdentityV3 extends Service {
    static type = 'identity'
    static version = '3'

    constructor(url: string, client: AxiosInstance) {
        super(IdentityV3.type, IdentityV3.version, url, client)
    }

    /**
     * Get permanent auth token
     * @param credentials
     */
    async getToken(credentials: AuthOptions): Promise<string> {
        const data = new authRequestData(credentials)
        let resp = await this.httpClient!
            .post<Token>('/auth/tokens', data)
            .catch(e => {
                console.log(e.toJSON())
                throw e
            })
        return resp.headers['X-Subject-Token']
    }

    _endpoints: endpoint[] = []
    _serviceRefs: serviceRef[] = []

    /**
     * Get list of available service references
     */
    async getServiceRefs(): Promise<serviceRef[]> {
        const resp = await this.httpClient
            .get<serviceRef[]>('/services')
            .catch(e => {
                console.log(e.toJSON())
                throw e
            })
        return resp.data
    }

    async getEndpoints(): Promise<endpoint[]> {
        const resp = await this.httpClient
            .get<{ endpoints: endpoint[] }>('/endpoints')
        return resp.data.endpoints
    }

    async getServiceUrl(type: string, version: string, region: string, visibility: string = "public"): Promise<any> {
        const getEp = async (): Promise<void> => {
            if (!this._endpoints) {
                this._endpoints = await this.getEndpoints()
            }
        }
        const getSer = async (): Promise<void> => {
            if (!this._serviceRefs) {
                this._serviceRefs = await this.getServiceRefs()
            }
        }
        await Promise.all([
            getEp(),
            getSer()
        ])
        const matchingService = this._serviceRefs.find(e => e.type == type)
        if (!matchingService) {
            throw `Service of type '${type}' not found`
        }
        const ep = this._endpoints.find(e =>
            e.region == region &&
            e.service_id == matchingService.id &&
            e.interface == visibility
        )
        if (!ep) {
            throw `Endpoint for service: ${matchingService.name}, region: ${region}, interface: ${visibility} not found`
        }
        let url = bareUrl(ep.url)
        const fallbackUrl = `${url}v${version}`
        let vers: version[] = []
        try {
            const r = await this.httpClient.get<{ versions: version[] }>(url)
            vers = r.data.versions
        } catch (e) {  // nice try, cowboy ;) openstack experience, hah?
            return fallbackUrl
        }
        const ver = vers.find(v => v.id.startsWith(version))
        if (!ver) {
            throw `Failed to find version of ${type} matching '${version}*'`
        }
        const link = ver.links.find(l => l.rel == 'self')
        if (!link || !link.href) {
            throw `Failed to find link to 'self' in ${JSON.stringify(ver.links)}`
        }
        return link.href
    }
}
