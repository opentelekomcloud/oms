import { AuthOptions, CloudConfig } from './core/types'
import { signRequest } from './core/signer'
import Service, { ServiceType } from './services/base'
import HttpClient from './core/http'
import _ from 'lodash'
import { CatalogEntity, IdentityV3, ResponseToken } from './services/identity/v3'


/**
 * Client is base provider client
 */
export default class Client {
    /**
     * client provides unauthorized access to public resources
     */
    httpClient: HttpClient
    authOptions: AuthOptions
    region = 'eu-de'

    set tokenID(v: string) {
        this.authOptions.token = v
    }

    get tokenID(): string {
        return this.authOptions.token || ''
    }

    get projectID(): string {
        return this.authOptions.project_id || ''
    }

    set projectID(id: string) {
        this.authOptions.project_id = id
    }

    get domainID(): string {
        return this.authOptions.domain_id || ''
    }

    set domainID(id: string) {
        this.authOptions.domain_id = id
    }

    constructor(cloud: CloudConfig) {
        this.authOptions = cloud.auth
        this.httpClient = new HttpClient({})
        this.injectAuthToken()
        // register identity service
        this.registerService(
            'identity',
            this.authOptions.auth_url,
        )
    }

    serviceMap: Map<string, string> = new Map<string, string>()

    registerService(type: string, url: string): void {
        this.serviceMap.set(type, url)
    }

    getService<S extends Service>(Type: ServiceType<S>): S {
        const serviceURL = this.serviceMap.get(Type.type)
        if (!serviceURL) {
            throw Error(`Service '${Type.type}' is not registered`)
        }
        return new Type(serviceURL, this.httpClient)
    }

    private getIdentity(): IdentityV3 {
        return this.getService(IdentityV3)
    }

    /**
     * Load service endpoint catalog for the region
     */
    saveServiceCatalog(catalog: CatalogEntity[]): void {
        catalog.forEach(ce => {
            const ep = ce.endpoints.find(e =>
                (e.region === this.region || e.region === '*') &&
                e.interface === 'public',
            )
            if (ep) {
                this.registerService(ce.type, ep.url)
            }
        })
    }

    /**
     * Authenticate with AK/SK
     */
    async authAkSk(): Promise<void> {
        // FIXME: NOT WORKING
        if (!this.authOptions.ak || !this.authOptions.sk) {
            throw Error(`Missing AK/SK: ${JSON.stringify(this.authOptions)}`)
        }
        // add signing interceptor
        this.httpClient.injectPreProcessor(signRequest(this.authOptions.ak, this.authOptions.sk))
        // FIXME: missing projectID and domainID loading
    }

    private injectAuthToken() {
        this.httpClient.injectPreProcessor(config => {
            if (this.tokenID) {
                config.headers.set('X-Auth-Token', this.tokenID)
            }
            return config
        })
    }

    /**
     * Authenticate with token
     */
    async authToken(): Promise<void> {
        const identity = this.getIdentity()
        let token: ResponseToken
        if (!this.tokenID) {
            token = await identity.issueToken(this.authOptions)
            this.tokenID = token.id
            this.injectAuthToken()
        } else {
            this.injectAuthToken()
            token = await identity.verifyToken(this.tokenID)
        }
        if (token.project) {
            this.projectID = token.project.id
        }
        this.domainID = token.user.domain.id
        if (!token.catalog) {
            throw Error('No service catalog provided')
        }
        this.saveServiceCatalog(token.catalog)
    }

    /**
     * Authenticate client and populate domainID and projectID
     */
    async authenticate(): Promise<void> {
        if (_.isEmpty(this.authOptions)) {
            throw new Error('Missing auth options')
        }
        if (this.authOptions.ak && this.authOptions.sk) {
            await this.authAkSk()
        } else {
            await this.authToken()
        }
    }
}
