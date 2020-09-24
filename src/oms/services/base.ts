import HttpClient from "../core/http";

/**
 * Service represents single service client
 */
export class Service {
    type: string
    version: string
    client: HttpClient

    constructor(type: string, version: string, url: string, client: HttpClient) {
        this.type = type
        this.version = version
        this.client = client.child(url)
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
