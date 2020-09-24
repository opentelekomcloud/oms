/**
 * Simple implementation of HTTP client based on `fetch` with
 * possibility to inject pre-request configuration handlers
 */
import _ from "lodash";

require('whatwg-fetch')
global.XMLHttpRequest = require('xhr2');

const _absUrlRe = /^https?:\/\/.+/

export class RequestConfig implements RequestInit {
    baseURL: string
    url: string
    headers: Headers
    body?: BodyInit
    method?: string

    constructor(baseURL: string, url: string, base: RequestInit) {
        this.url = url
        this.baseURL = baseURL
        this.headers = new Headers(base.headers)
        this.body = base.body ? base.body : undefined
        this.method = base.method
    }
}

export type RequestConfigHandler = (i: RequestConfig) => RequestConfig

export class HttpResponse<T> extends Response {
    data!: T
}

export class HttpError extends Error {
}

export default class HttpClient {
    baseURL: string
    baseConfig: RequestInit

    _beforeRequest: RequestConfigHandler[] = []

    /**
     * Add pre-process request config handler
     * handlers are executed in FILO order
     * @param handler
     */
    injectPreProcessor(handler: RequestConfigHandler) {
        this._beforeRequest.push(handler)
    }

    constructor(baseURL?: string, baseConfig?: RequestInit) {
        this.baseURL = baseURL ? baseURL : ''
        this.baseConfig = baseConfig ? _.cloneDeep(baseConfig) : {}
    }

    /**
     * Create new HttpClient inheriting all client settings
     */
    child(baseURL?: string, baseConfig?: RequestInit): HttpClient {
        const client = _.cloneDeep(this)
        client.baseURL = baseURL ? baseURL : ''
        client.baseConfig = baseConfig ? _.cloneDeep(baseConfig) : {}
        return client
    }

    /**
     * Base request method
     * @param method - HTTP method to be used ('GET', 'POST', ...)
     * @param url - resource URL, will be joined with base URL set in configuration
     * @param headers - resource additional headers
     * @param body - request JSON body
     * @param handler - pre-request request configuration handler, will be used before other handlers
     */
    async request<T>(method: string, url: string, headers?: Headers, body?: string, handler?: RequestConfigHandler): Promise<HttpResponse<T>> {
        let config = new RequestConfig(this.baseURL, url, this.baseConfig)
        // merge headers
        let requestHeaders = new Headers(config.headers)
        if (headers) {
            headers.forEach((v, k) => requestHeaders.append(k, v))
        }
        config.headers = requestHeaders
        config.method = method
        config.body = body

        if (handler) {
            config = handler(config)
        }
        for (const b of this._beforeRequest.reverse()) {
            config = b(config)
        }
        if (!url.match(_absUrlRe)) {
            url = new URL(config.url, config.baseURL).href
        }
        let response = await fetch(url, config) as HttpResponse<T>
        if (response.ok) {
            response.data = await response.json()
        } else {
            throw new HttpError(
                `HTTP error received. ${response.status} ${response.statusText}: ${await response.text()}`
            )
        }
        return response
    }

    async get<T>(url: string, headers?: Headers, handler?: RequestConfigHandler): Promise<HttpResponse<T>> {
        return await this.request('GET', url, headers, undefined, handler)
    }

    async post<T>(url: string, body?: object, headers?: Headers, handler?: RequestConfigHandler): Promise<HttpResponse<T>> {
        return await this.request('POST', url, headers, _jsonBody(body), handler)
    }

    async put<T>(url: string, body?: object, headers?: Headers, handler?: RequestConfigHandler): Promise<HttpResponse<T>> {
        return await this.request('PUT', url, headers, _jsonBody(body), handler)
    }

    async delete<T>(url: string, headers?: Headers, handler?: RequestConfigHandler): Promise<HttpResponse<T>> {
        return await this.request('DELETE', url, headers, undefined, handler)
    }
}

function _jsonBody(body?: object): string {
    let bodyString = ''
    if (body) {
        bodyString = JSON.stringify(body)
    }
    return bodyString
}
