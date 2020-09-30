import { AuthOptions } from '../../core/types'
import Service, { bareUrl } from '../base'
import HttpClient from '../../core/http'
import { createToken, Token } from './v3/tokens'
import { createCredential, Credential } from './v3/credentials'
import { listServices, ServiceRef } from './v3/services'
import { Endpoint, listEndpoints } from './v3/endpoints'

interface version {
    id: string
    links: {
        rel: string
        href: string
    }[]
    status: string
}

class ServiceDiscoveryError extends Error {
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
    async createToken(credentials: AuthOptions): Promise<Token> {
        return createToken(this.client, credentials)
    }

    /**
     * Create permanent AK/SK
     * @param userID
     * @param description
     */
    async getAKSK(userID: string, description?: string): Promise<Credential> {
        return await createCredential(this.client, userID, description)
    }

    private endpoints: Endpoint[] = []

    private serviceRefs: ServiceRef[] = []

    async getServiceRefs(): Promise<ServiceRef[]> {
        if (!this.endpoints.length) {
            this.serviceRefs = await listServices(this.client)
        }
        return this.serviceRefs
    }

    async getEndpoints(): Promise<Endpoint[]> {
        if (!this.endpoints.length) {
            this.endpoints = await listEndpoints(this.client)
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
            throw new ServiceDiscoveryError(`Service of type '${type}' not found`)
        }
        const ep = this.endpoints.find(e => e.region == region
            && e.service_id == matchingService.id
            && e.interface == visibility)
        if (!ep) {
            throw new ServiceDiscoveryError(
                `Endpoint for service: ${matchingService.name},` +
                `region: ${region}, interface: ${visibility} not found`)
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
            throw new ServiceDiscoveryError(`Failed to find link to 'self' in ${JSON.stringify(ver.links)}`)
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
