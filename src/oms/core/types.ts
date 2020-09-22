import axios, {AxiosInstance} from "axios";

export class NameOrID {
    id?: string
    name?: string
}


export class AuthOptions {
    token?: string

    domainID?: string
    domainName?: string
    username?: string
    userID?: string
    password?: string
    projectName?: string
    projectID?: string

    accessKey?: string
    secretKey?: string
}

/**
 * Service represents single service client
 */
export class Service {
    name: string
    type: string
    version: string
    httpClient?: AxiosInstance

    constructor(name: string, type: string, version: string, url: string, httpClient: AxiosInstance) {
        this.name = name
        this.type = type
        this.version = version
        this.httpClient = axios.create({baseURL: url})
        this.httpClient.interceptors = httpClient.interceptors // auth is done using interceptors
    }
}
