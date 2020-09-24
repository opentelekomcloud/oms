import {AuthOptions, CloudConfig} from "./core/types";
import {setUserAgent, signRequest} from "./core/signer";
import {IdentityV3} from "./services/identity";
import {Service} from "./services/base";
import HttpClient from "./core/http";

function _get_service_key(type: string, version: string): string {
    return `${type}/${version}`
}

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

    /**
     * List of used services
     */
    services = [
        {type: 'identity', version: '3'},
        {type: 'compute', version: '2'},
        {type: 'ecs', version: '1'},
        {type: 'image', version: '2'},
        {type: 'network', version: '2'},
        {type: 'vpc', version: '1'},
    ]

    set token(v: string) {
        this.authOptions.token = v
    }

    get token(): string {
        return this.authOptions.token || ''
    }

    constructor(cloud: CloudConfig) {
        this.authOptions = cloud.auth
        this.httpClient = new HttpClient('')

        // register identity service
        this.registerService(new IdentityV3(this.authOptions.auth_url, this.httpClient))
    }

    _services: Map<string, Service> = new Map<string, Service>()

    registerService(service: Service) {
        this._services.set(
            _get_service_key(service.type, service.version),
            service
        )
    }

    getService(type: string, version: string): Service {
        const service = this._services.get(_get_service_key(type, version))
        if (!service) {
            throw `Service '${service}' is not registered`
        }
        return service
    }

    _getIdentity(): IdentityV3 {
        return this.getService(IdentityV3.type, IdentityV3.version) as IdentityV3
    }

    /**
     * Load service endpoint catalog for the region
     */
    async loadServiceCatalog() {
        const iam = this._getIdentity()
        // load catalog to catalog cache:
        await iam.loadServiceEndpointCatalog()
        let waitServices: Promise<any>[] = []
        for (const s of this.services) {
            // this is actually synchronous when service catalog is cached
            waitServices.push(
                iam.getServiceUrl(s.type, s.version, this.region)
                    .then(url =>
                        this.registerService(
                            new Service(s.type, s.version, url, this.httpClient)
                        ))
                    .catch(e => console.error(`${e}\nFailed to load URL for service ${JSON.stringify(s)}`))
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
            config = setUserAgent(config)
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
        // re-register Identity service with authorized client
        this.registerService(new IdentityV3(this.authOptions.auth_url, this.httpClient))
        await this.loadServiceCatalog()
    }
}
