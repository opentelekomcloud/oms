import {AuthOptions, CloudConfig} from "./core/types";
import {signRequest} from "./core/signer";
import IdentityV3 from "./services/identity";
import Service, {ServiceType} from "./services/base";
import HttpClient from "./core/http";


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
    _services: Map<string, string> = new Map<string, string>()

    registerService(type: string, version: string, url: string) {
        this._services.set(_get_service_key(type, version), url)
    }

    getService<S extends Service>(serviceType: ServiceType<S>): S {
        const serviceURL = this._services.get(_get_service_key(serviceType.type, serviceType.version))
        if (!serviceURL) {
            throw `Service '${serviceURL}' is not registered`
        }
        return new serviceType(serviceURL, this.httpClient)
    }

    _getIdentity(): IdentityV3 {
        return this.getService(IdentityV3)
    }

    /**
     * Load service endpoint catalog for the region
     */
    async loadServiceCatalog() {
        const iam = this._getIdentity()
        // load catalog to catalog cache:
        await iam.loadServiceEndpointCatalog()
        let waitServices: Promise<any>[] = []
        for (const key of this.services) {
            const [type, version] = key.split('/', 2)
            waitServices.push(
                iam.getServiceUrl(type, version, this.region)
                    .then(url => this.registerService(type, version, url))
                    .catch(e => console.error(`${e}\nFailed to load URL for service ${key}`))
            )
        }
        await Promise.all(waitServices)  // wait for all services to be read
    }

    _authAkSk() {
        // add signing interceptor
        this.httpClient.injectPreProcessor(signRequest(this.authOptions.ak!, this.authOptions.sk!))
        return
    }

    async _authToken() {
        if (!this.token) {
            const identity = this._getIdentity()
            this.token = await identity.getToken(this.authOptions)
        }
        const token = this.token
        this.httpClient.injectPreProcessor(config => {
            config.headers.set('X-Auth-Token', token)
            return config
        })
    }

    async authenticate() {
        if (!this.authOptions) {
            throw 'Missing auth options'
        }
        if (this.authOptions.ak && this.authOptions.sk) {
            this._authAkSk()
        } else {
            await this._authToken()
        }
        await this.loadServiceCatalog()
    }
}

function _get_service_key(type: string, version: string | number): string {
    version = String(version)
    if (!version.startsWith('v')) {
        version = `v${version}`
    }
    return `${type}/${version}`
}
