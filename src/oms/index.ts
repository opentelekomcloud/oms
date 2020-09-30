import { AuthOptions, CloudConfig } from './core/types'
import { signRequest } from './core/signer'
import IdentityV3 from './services/identity'
import Service, { ServiceType } from './services/base'
import HttpClient from './core/http'
import _ from 'lodash'


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

    set token(v: string) {
        this.authOptions.token = v
    }

    get token(): string {
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
        // register identity service
        this.registerService(
            'identity',
            'v3',
            this.authOptions.auth_url,
        )
    }

    services = [
        'identity/v3',
        'image/v2',
    ]

    serviceMap: Map<string, string> = new Map<string, string>()

    registerService(type: string, version: string, url: string): void {
        this.serviceMap.set(Client.get_service_key(type, version), url)
    }

    getService<S extends Service>(Type: ServiceType<S>): S {
        const serviceURL = this.serviceMap.get(Client.get_service_key(Type.type, Type.version))
        if (!serviceURL) {
            throw Error(`Service '${serviceURL}' is not registered`)
        }
        return new Type(serviceURL, this.httpClient)
    }

    private getIdentity(): IdentityV3 {
        return this.getService(IdentityV3)
    }

    /**
     * Load service endpoint catalog for the region
     */
    async loadServiceCatalog(): Promise<void> {
        const iam = this.getIdentity()
        // load catalog to catalog cache:
        await iam.loadServiceEndpointCatalog()
        const waitServices: Promise<void>[] = []
        for (const key of this.services) {
            const [type, version] = key.split('/', 2)
            waitServices.push(
                iam.getServiceUrl(type, version, this.region)
                    .then(url => this.registerService(type, version, url))
                    .catch(e => console.error(`${e}\nFailed to load URL for service ${key}`)),
            )
        }
        await Promise.all(waitServices) // wait for all services to be read
    }

    /**
     * Authenticate with AK/SK
     */
    async authAkSk(): Promise<void> {
        // FIXME: not really signing
        if (!this.authOptions.ak || !this.authOptions.sk) {
            throw Error(`Missing AK/SK: ${JSON.stringify(this.authOptions)}`)
        }
        // add signing interceptor
        this.httpClient.injectPreProcessor(signRequest(this.authOptions.ak, this.authOptions.sk))
        // FIXME: missing projectID and domainID loading
    }

    /**
     * Authenticate with token
     */
    async authToken(): Promise<void> {
        if (!this.token) {
            const identity = this.getIdentity()
            const token = await identity.createToken(this.authOptions)
            this.token = token.id
            if (token.project) {
                this.projectID = token.project.id
            }
            this.domainID = token.user.domain.id
        }
        this.httpClient.injectPreProcessor(config => {
            config.headers.set('X-Auth-Token', this.token)
            return config
        })
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
        await this.loadServiceCatalog()
    }

    private static get_service_key(type: string, version: string | number): string {
        let ver = String(version)
        if (!ver.startsWith('v')) {
            ver = `v${ver}`
        }
        return `${type}/${ver}`
    }
}
