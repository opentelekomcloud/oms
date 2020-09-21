import axios, {AxiosInstance, AxiosRequestConfig} from "axios";
import {AuthOptions} from "./types";
import {akskInterceptor, SetUserAgent} from "./core/signer";
import {Keystone} from "./services/keystone";

const defaultAuthURL = 'https://iam.eu-de.otc.t-systems.com/v3'

/**
 * Client is base provider client
 */
export class Client {

    authURL = defaultAuthURL
    httpClient: AxiosInstance

    authOptions: AuthOptions

    constructor(authOpts: AuthOptions) {
        this.authOptions = authOpts
        this.httpClient = axios.create({})
    }

    async authenticate() {
        if (this.authOptions.accessKey && this.authOptions.secretKey) {
            // add signing interceptor
            this.httpClient.interceptors.request.use(
                akskInterceptor(
                    this.authOptions.accessKey,
                    this.authOptions.secretKey,
                ))
            return
        }
        let token = this.authOptions.token
        if (!token) {
            const iam = new Keystone(this.authURL, this.httpClient)
            this.authOptions.token = await iam.getToken(this.authOptions)
        }
        this.httpClient.interceptors.request.use((config: AxiosRequestConfig) => {
            config = SetUserAgent(config)
            config.headers['X-Auth-Token'] = token
            return config
        })
    }
}


/**
 * Service represents single service client
 */
export class Service {
    name: string
    type: string
    version: string
    httpClient: AxiosInstance

    constructor(name: string, type: string, version: string, url: string, httpClient: AxiosInstance) {
        this.name = name
        this.type = type
        this.version = version
        this.httpClient = axios.create({baseURL: url})
        this.httpClient.interceptors = httpClient.interceptors // auth is done using interceptors
    }
}
