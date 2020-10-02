/**
 * Simple implementation of HTTP client based on `fetch` with
 * possibility to inject pre-request configuration handlers
 */
import _ from 'lodash';
import { ParsedQuery, stringifyUrl } from 'query-string';
import { validate } from 'json-schema'
import { JSONSchema } from './types';

require('isomorphic-fetch')

export type RequestConfigHandler = (i: RequestOpts) => RequestOpts

const _absUrlRe = /^https?:\/\/.+/

export interface JSONResponse<T> extends Response {
    data: T
}

export class HttpError extends Error {
    name = 'HTTPError'
    statusCode: number

    constructor(statusCode: number, message?: string) {
        super(message)
        this.statusCode = statusCode
    }
}

export class RequestError extends Error {
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

    // json schema to validate response JSON with
    schema?: JSONSchema
}

/**
 * Convert input header-like object to list of headers
 */
function normalizeHeaders(src?: AbsHeaders): Headers {
    const result = new Headers()
    if (!src) {
        return result
    }
    if (src instanceof Headers) {
        return new Headers(src)
    }
    Object.entries(src)
        .forEach(e => {
            if (e[1] != null) {
                result.append(e[0], String(e[1]))
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
    const headers = normalizeHeaders(one)
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

    schema: JSONSchema

    constructor(abs: RequestOptsAbs) {
        // check absolutely minimal requirements:
        if (!abs.method) {
            throw new RequestError(`Request without Method: ${JSON.stringify(abs)}`)
        }
        this.method = abs.method
        if (!abs.url) {
            throw new RequestError(`Request without URL: ${JSON.stringify(abs)}`)
        }
        this.url = abs.url
        this.headers = mergeHeaders(abs.headers)
        const outParams: ParsedQuery = {}
        const inParams = abs.params
        if (inParams) {
            Object.keys(inParams).forEach(k => {
                const v = inParams[k]
                if (v != null) {
                    outParams[k] = String(inParams[k])
                }
            })
        }
        this.params = outParams
        if (abs.json) {
            this.body = JSON.stringify(abs.json)
        }
        if (abs.handler) {
            this.handler = abs.handler
        }
        this.schema = abs.schema ? abs.schema : {}
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
    async request<T>(opts: RequestOptsAbs): Promise<JSONResponse<T>> {
        let merged = new RequestOpts(opts)
        if (!merged.baseURL) {
            merged.baseURL = this.baseConfig.baseURL
        }
        // merge headers
        merged.headers = mergeHeaders(this.baseConfig.headers, merged.headers)
        if (merged.handler) {
            merged = merged.handler(merged)
        }
        for (const b of this.beforeRequest.reverse()) {
            merged = b(merged)
        }

        let { baseURL, url } = merged
        baseURL = baseURL ? baseURL : this.baseConfig.baseURL
        if (!url.match(_absUrlRe) && !!baseURL) {
            url = joinURL(baseURL, url)
        }
        // append query params
        if (merged.params) {
            url = stringifyUrl({
                url,
                query: merged.params,
            }, { encode: true, skipNull: true })
        }
        const response = await fetch(url, merged) as JSONResponse<T>
        if (!response.ok) {
            throw new HttpError(
                response.status,
                `HTTP error received. ${response.status} ${response.statusText}: ${await response.text()}`
                + `Request Opts:\n${JSON.stringify(opts)}`,
            )
        }
        const data = await response.text()
        response.data = data ? JSON.parse(data) : {} as T
        // will be validated against own 'schema' field, if one is provided
        const result = validate(response.data, merged.schema)
        if (!result.valid) {
            throw Error(`Failed JSON Schema validation: ${result.errors}`)
        }
        return response
    }

    async get<T>(opts: RequestOptsAbs): Promise<JSONResponse<T>> {
        opts.method = 'GET'
        return await this.request(opts)
    }

    async post<T>(opts: RequestOptsAbs): Promise<JSONResponse<T>> {
        opts.method = 'POST'
        return await this.request(opts)
    }

    async put<T>(opts: RequestOptsAbs): Promise<JSONResponse<T>> {
        opts.method = 'PUT'
        return await this.request(opts)
    }

    async delete(opts: RequestOptsAbs): Promise<JSONResponse<unknown>> {
        opts.method = 'DELETE'
        return await this.request(opts)
    }
}

const barePartRe = /^\/*(.+?)\/*$/

export function joinURL(...parts: string[]): string {
    const urls: string[] = []
    for (const p of parts) {
        const matches = p.match(barePartRe)
        if (!matches || matches.length !== 2) {
            continue
        }
        urls.push(matches[1])
    }
    return urls.join('/')
}
