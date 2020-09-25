import HttpClient from "../core/http";

/**
 * Describes service type with type, version and constructor
 */
export interface ServiceType<T> {
    readonly type: string
    readonly version: string
    new(url: string, client: HttpClient): T
}

/**
 * Service represents single service client
 */
export default abstract class Service {
    static readonly type: string = ''
    static readonly version: string = ''
    client: HttpClient

    protected constructor(url: string, client: HttpClient) {
        this.client = client.child({baseURL: url})
    }
}

/**
 * Return base service url, e.g. https://iam.eu-de.otc.t-systems.com/
 * @param serviceUrl - url from service catalog
 */
export function bareUrl(serviceUrl: string): string {
    const url = new URL(serviceUrl)
    return `${url.protocol}//${url.host}`
}
