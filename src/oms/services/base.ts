import HttpClient, { RequestOptsAbs } from '../core/http';

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
        this.client = client.child({ baseURL: url })
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

/**
 * Abstract page having only default properties
 */
export interface Page {
    readonly schema?: string
    readonly next?: string
    readonly first?: string
}

/**
 * Pager for lazy pagination implementation. <T> describes page structure
 */
export class Pager<T extends Page> implements AsyncIterable<T>, AsyncIterator<T, T> {
    // Service-bind http client
    readonly client: HttpClient
    readonly pageOpts: RequestOptsAbs

    private firstIteration: boolean

    constructor(opts: RequestOptsAbs, client: HttpClient) {
        this.pageOpts = opts
        this.client = client
        this.firstIteration = true
    }

    [Symbol.asyncIterator](): Pager<T> {
        return this
    }

    /**
     * Load next paginator page
     */
    async next(): Promise<IteratorResult<T, T>> {
        const resp = await this.client.get<T>(this.pageOpts)
        if (!resp.ok) {
            throw `HTTP error during pagination: ${resp.status} (${JSON.stringify(await resp.text())})`
        }
        this.pageOpts.url = resp.data.next   // change next request url
        if (this.firstIteration) {
            this.pageOpts.params = undefined // remove params, the are already part of `next`
            this.firstIteration = false
        }
        return { value: resp.data, done: !resp.data.next }
    }
}
