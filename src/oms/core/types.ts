import axios, {AxiosInstance} from "axios";

export class NameOrID {
    id?: string
    name?: string
}

/**
 * Simple implementation of OpenStack auth options
 */
export class AuthOptions {
    auth_url!: string
    token?: string
    username?: string
    password?: string
    domain_name?: string
    domain_id?: string
    project_name?: string
    project_id?: string

    ak?: string
    sk?: string
}

/**
 * OpenTelekomCloud cloud configuration
 */
export class CloudConfig {
    auth: AuthOptions

    constructor() {
        this.auth = new (AuthOptions)
    }
}

/**
 * CloudConfigHelper provides helper functions to get cloud configurations
 */
export class CloudConfigHelper {
    authUrl: string

    constructor(authUrl: string) {
        this.authUrl = authUrl
    }

    baseCfg(): CloudConfig {
        const cc = new (CloudConfig)
        cc.auth.auth_url = this.authUrl
        return cc
    }


    simplePasswordConfig(domainName: string, username: string, password: string, projectName: string) {
        const cc = this.baseCfg()
        cc.auth.domain_name = domainName
        cc.auth.username = username
        cc.auth.password = password
        cc.auth.project_name = projectName
        return cc
    }

    simpleTokenConfig(token: string) {
        const cc = this.baseCfg()
        cc.auth.token = token
        return cc
    }
}

/**
 * Service represents single service client
 */
export class Service {
    type: string
    version: string
    httpClient?: AxiosInstance

    constructor(type: string, version: string, url: string, httpClient?: AxiosInstance) {
        this.type = type
        this.version = version
        this.httpClient = axios.create({baseURL: url})
        if (httpClient) {
            this.httpClient.interceptors = httpClient.interceptors // auth is done using interceptors
        }
    }
}
