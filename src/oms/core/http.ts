/**
 * Simple implementation of HTTP client based on `fetch` with
 * possibility to inject pre-request configuration handlers
 */
import _ from "lodash";
import {ParsedQuery, stringifyUrl} from 'query-string'

require('isomorphic-fetch')

export type RequestConfigHandler = (i: RequestOpts) => RequestOpts

const _absUrlRe = /^https?:\/\/.+/

export class HttpResponse<T> extends Response {
    data!: T
}

export class HttpError extends Error {
}

export interface QueryParams {
    [key: string]: any
}

export interface RequestOptsAbs {
    url?: string
    baseURL?: string
    method?: string
    params?: ParsedQuery | QueryParams
    headers?: Headers
    json?: object
    handler?: RequestConfigHandler
}

/**
 * This is presentation of prepared request opts
 */
export class RequestOpts implements RequestOptsAbs {
    url: string
    baseURL?: string
    method: string
    params: ParsedQuery
    headers: Headers
    json?: object
    text: string
    handler?: RequestConfigHandler

    constructor(abs: RequestOptsAbs) {
        // check absolutely minimal requirements:
        if (!abs.method) {
            throw `Request without Method: ${JSON.stringify(abs)}`
        }
        this.method = abs.method
        if (!abs.url) {
            throw `Request without URL: ${JSON.stringify(abs)}`
        }
        this.url = abs.url
        this.headers = new Headers(abs.headers)
        const outParams: ParsedQuery = {}
        const inParams = abs.params
        if (inParams) {
            Object.keys(inParams).forEach(k => {
                const v = inParams[k]
                if (v != undefined) {
                    outParams[k] = String(inParams[k])
                }
            })
        }
        this.params = outParams
        this.text = abs.json ? JSON.stringify(abs.json) : ''
    }
}

export default class HttpClient {
    baseConfig: RequestOptsAbs

    _beforeRequest: RequestConfigHandler[] = []

    /**
     * Add pre-process request config handler
     * handlers are executed in FILO order
     * @param handler
     */
    injectPreProcessor(handler: RequestConfigHandler) {
        this._beforeRequest.push(handler)
    }

    constructor(baseConfig?: RequestOptsAbs) {
        this.baseConfig = baseConfig ? _.cloneDeep(baseConfig) : {}
        this.baseConfig.headers = new Headers(this.baseConfig.headers)
        this.baseConfig.headers.set('User-Agent', 'OpenTelekomCloud JS/v1.0')
    }

    /**
     * Create new HttpClient inheriting all client settings
     */
    child(overrideConfig?: RequestOptsAbs): HttpClient {
        const client = _.cloneDeep(this)
        client.baseConfig = overrideConfig ? _.cloneDeep(overrideConfig) : {}
        return client
    }

    /**
     * Base request method
     */
    async request<T>(opts: RequestOptsAbs): Promise<HttpResponse<T>> {
        let merged = new RequestOpts(opts)
        if (!merged.baseURL) {
            merged.baseURL = this.baseConfig.baseURL
        }
        // merge headers
        merged.headers = new Headers(this.baseConfig.headers)
        if (opts.headers) {
            opts.headers.forEach((v, k) => merged.headers!.append(k, v))
        }
        merged.baseURL = merged.baseURL ? merged.baseURL : this.baseConfig.baseURL
        if (merged.handler) {
            merged = merged.handler(merged)
        }
        for (const b of this._beforeRequest.reverse()) {
            merged = b(merged)
        }

        let url = merged.url
        if (!url.match(_absUrlRe)) {  // use absolute URL without joining with base url
            url = new URL(url, merged.baseURL).href
        }
        // append query params
        if (merged.params) {
            url = stringifyUrl({
                url: url,
                query: merged.params
            }, {encode: true, skipNull: true})
        }
        let response = await fetch(url, merged) as HttpResponse<T>
        if (response.ok) {
            response.data = await response.json()
        } else {
            throw new HttpError(
                `HTTP error received. ${response.status} ${response.statusText}: ${await response.text()}` +
                `Request Opts:\n${JSON.stringify(opts)}`
            )
        }
        return response
    }

    async get<T>(opts: RequestOptsAbs): Promise<HttpResponse<T>> {
        opts.method = 'GET'
        return await this.request(opts)
    }

    async post<T>(opts: RequestOptsAbs): Promise<HttpResponse<T>> {
        opts.method = 'POST'
        return await this.request(opts)
    }

    async put<T>(opts: RequestOptsAbs): Promise<HttpResponse<T>> {
        opts.method = 'PUT'
        return await this.request(opts)
    }

    async delete<T>(opts: RequestOptsAbs): Promise<HttpResponse<T>> {
        opts.method = 'DELETE'
        return await this.request(opts)
    }
}
