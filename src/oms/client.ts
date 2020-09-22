import axios, {AxiosInstance, AxiosRequestConfig} from "axios";
import {AuthOptions, CloudConfig, Service} from "./core/types";
import {setUserAgent, signRequest} from "./core/signer";
import {Keystone} from "./services/keystone";

function _get_service_key(type: string, version: string): string {
    return `${type}/${version}`
}

/**
 * Client is base provider client
 */
export default class Client {
    /**
     * httpClient provides unauthorized access to public resources
     */
    httpClient: AxiosInstance

    authOptions: AuthOptions

    set token(v: string) {
        this.authOptions.token = v
    }

    get token(): string {
        return this.authOptions.token || ''
    }

    constructor(cloud: CloudConfig) {
        this.authOptions = cloud.auth
        this.httpClient = this.newHttpClient()

        // register identity service with unauthorized client
        this.registerService(new Keystone(this.authOptions.auth_url, this.httpClient))
    }

    _services: Map<string, Service> = new Map<string, Service>()

    newHttpClient(): AxiosInstance {
        return axios.create({})
    }

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

    async loadServiceCatalog() {
        // TODO: implement me
    }

    _authAkSk() {
        // add signing interceptor
        this.httpClient.interceptors.request.use(
            signRequest(this.authOptions.ak!, this.authOptions.sk!))
        return
    }

    async _authToken() {
        let token = this.token
        if (!token) {
            const identity = this.getService(Keystone.type, Keystone.version) as Keystone
            this.token = await identity.getToken(this.authOptions)
        }
        this.httpClient.interceptors.request.use((config: AxiosRequestConfig) => {
            config = setUserAgent(config)
            config.headers['X-Auth-Token'] = token
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
