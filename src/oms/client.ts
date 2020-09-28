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
            throw `Service '${serviceURL}' is not registered`
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

    authAkSk(): void {
        if (!this.authOptions.ak || !this.authOptions.sk) {
            throw `Missing AK/SK: ${JSON.stringify(this.authOptions)}`
        }
        // add signing interceptor
        this.httpClient.injectPreProcessor(signRequest(this.authOptions.ak, this.authOptions.sk))
    }

    async authToken(): Promise<void> {
        if (!this.token) {
            const identity = this.getIdentity()
            this.token = await identity.getToken(this.authOptions)
        }
        const { token } = this
        this.httpClient.injectPreProcessor(config => {
            config.headers.set('X-Auth-Token', token)
            return config
        })
    }

    async authenticate(): Promise<void> {
        if (_.isEmpty(this.authOptions)) {
            throw new Error('Missing auth options')
        }
        if (this.authOptions.ak && this.authOptions.sk) {
            this.authAkSk()
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
