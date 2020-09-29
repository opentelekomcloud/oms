/**
 * Simple implementation of HTTP client based on `fetch` with
 * possibility to inject pre-request configuration handlers
 */
import _ from 'lodash';
import { ParsedQuery, stringifyUrl } from 'query-string';

require('isomorphic-fetch')

export type RequestConfigHandler = (i: RequestOpts) => RequestOpts

const _absUrlRe = /^https?:\/\/.+/

export class HttpResponse<T> extends Response {
    data!: T
}

export class HttpError extends Error {
}

export interface QueryParams {
    [key: string]: unknown
}

type AbsHeaders = HeadersInit | Record<string, string | boolean | number | undefined>

export interface RequestOptsAbs {
    url?: string
    baseURL?: string
    method?: string
    params?: ParsedQuery | QueryParams
    headers?: AbsHeaders
    json?: Record<string, unknown>
    handler?: RequestConfigHandler
}

/**
 * Convert input header-like object to list of headers
 */
function normalizeHeaders(src?: AbsHeaders): string[][] {
    if (!src) {
        return []
    }
    const result: string[][] = []
    Object.entries(src)
        .forEach(e => {
            if (e[1] != undefined) {
                result.push([e[0], String(e[1])])
            }
        })
    return result
}

/**
 * Merge existing sets of headers producing new Headers instance
 */
export function mergeHeaders(one?: AbsHeaders, two?: AbsHeaders): Headers {
    if (!one && !two) {
        return new Headers()
    }
    const headers = new Headers(normalizeHeaders(one))
    if (two) {
        for (const [k, v] of normalizeHeaders(two)) {
            headers.append(k, v)
        }
    }
    return headers
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
    json?: Record<string, unknown>
    body?: string
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
        this.headers = mergeHeaders(abs.headers)
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
        if (abs.json) {
            this.body = JSON.stringify(abs.json)
        }
    }
}

function prepareConfig(base?: RequestOptsAbs) {
    const baseConfig = base && !_.isEmpty(base) ? _.cloneDeep(base) : {}
    baseConfig.headers = mergeHeaders(baseConfig.headers)
    baseConfig.headers.set('User-Agent', 'OpenTelekomCloud JS/v1.0')
    return baseConfig
}

export default class HttpClient {
    baseConfig: RequestOptsAbs

    private beforeRequest: RequestConfigHandler[] = []

    /**
     * Add pre-process request config handler
     * handlers are executed in FILO order
     * @param handler
     */
    injectPreProcessor(handler: RequestConfigHandler): void {
        this.beforeRequest.push(handler)
    }

    constructor(baseConfig?: RequestOptsAbs) {
        this.baseConfig = prepareConfig(baseConfig)
    }

    /**
     * Create new HttpClient inheriting all client settings
     */
    child(overrideConfig?: RequestOptsAbs): HttpClient {
        const client = _.cloneDeep(this)
        client.baseConfig = overrideConfig ? prepareConfig(overrideConfig) : prepareConfig()
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
        merged.headers = mergeHeaders(this.baseConfig.headers, merged.headers)
        merged.baseURL = opts.baseURL ? opts.baseURL : this.baseConfig.baseURL
        if (merged.handler) {
            merged = merged.handler(merged)
        }
        for (const b of this.beforeRequest.reverse()) {
            merged = b(merged)
        }

        let { url } = merged
        if (!url.match(_absUrlRe)) { // use absolute URL without joining with base url
            url = new URL(url, merged.baseURL).href
        }
        // append query params
        if (merged.params) {
            url = stringifyUrl({
                url,
                query: merged.params,
            }, { encode: true, skipNull: true })
        }
        const response = await fetch(url, merged) as HttpResponse<T>
        if (response.ok) {
            response.data = await response.json()
        } else {
            throw new HttpError(
                `HTTP error received. ${response.status} ${response.statusText}: ${await response.text()}`
                + `Request Opts:\n${JSON.stringify(opts)}`,
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
