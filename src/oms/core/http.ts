/**
 * Simple implementation of HTTP client based on `fetch` with
 * possibility to inject pre-request configuration handlers
 */
import cloneDeep from 'lodash/cloneDeep'
import isEmpty from 'lodash/isEmpty'
import { ParsedQuery, stringifyUrl } from 'query-string'
import { validate } from 'json-schema'
import { JSONSchema } from './types'
import fetch, { Headers } from 'cross-fetch'

export type RequestConfigHandler = (i: RequestOpts) => RequestOpts

const absUrlRe = /^https?:\/\/.+/

export interface JSONResponse<T> extends Response {
    data: T
    raw: Blob
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
        if (abs.url == null) {
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
    const baseConfig = base && !isEmpty(base) ? cloneDeep(base) : {}
    baseConfig.headers = mergeHeaders(baseConfig.headers)
    return baseConfig
}

/**
 * Pre-request config handlers
 * You can iterate over peloton, last and first are available only directly.
 * The `first` and `last` are special cases. Don't use them except you know
 * this handler absolutely _must_ be the first or the last one.
 * Otherwise just use `.push(...)` to add the handler
 */
export class Handlers implements Iterable<RequestConfigHandler> {
    first?: RequestConfigHandler
    private readonly peloton: RequestConfigHandler[] = []
    signing?: RequestConfigHandler  // special case for ak/sk signing, it's executed before the last one
    last?: RequestConfigHandler

    * [Symbol.iterator](): Iterator<RequestConfigHandler> {
        yield* this.peloton.reverse()
    }

    public push(handler: RequestConfigHandler): void {
        this.peloton.push(handler)
    }
}

export default class HttpClient {
    baseConfig: RequestOptsAbs

    public beforeRequest: Handlers

    constructor(baseConfig?: RequestOptsAbs) {
        this.baseConfig = prepareConfig(baseConfig)
        this.beforeRequest = new Handlers()
    }

    /**
     * Create new HttpClient inheriting all client settings
     */
    child(overrideConfig?: RequestOptsAbs): HttpClient {
        const client = cloneDeep(this)
        client.baseConfig = overrideConfig ? prepareConfig(overrideConfig) : prepareConfig()
        return client
    }

    /**
     * Base request method
     *
     * #### NB! this method can return object not matching given type value
     */
    // eslint-disable-next-line @typescript-eslint/ban-types
    async request<T extends {}>(opts: RequestOptsAbs): Promise<JSONResponse<T>> {
        let merged = new RequestOpts(opts)
        if (!merged.baseURL) {
            merged.baseURL = this.baseConfig.baseURL
        }
        merged.headers = mergeHeaders(this.baseConfig.headers, merged.headers)
        // handlers are executed in order: beforeRequest.first, opts.handler,
        // beforeRequest.peloton, ..., beforeRequest.last
        // note that beforeRequest.last executed just before `fetch` and receives 100%
        // prepared request
        if (this.beforeRequest.first) {
            merged = this.beforeRequest.first(merged)
        }
        if (merged.handler) {
            merged = merged.handler(merged)
        }
        for (const b of this.beforeRequest) {
            merged = b(merged)
        }

        let { baseURL, url } = merged
        baseURL = baseURL ? baseURL : this.baseConfig.baseURL
        if (!url.match(absUrlRe) && !!baseURL) {
            url = joinURL(baseURL, url)
        }
        // append query params
        if (merged.params) {
            url = stringifyUrl({
                url,
                query: merged.params,
            }, { encode: true, skipNull: true })
        }
        merged.url = url
        merged.baseURL = ''

        if (this.beforeRequest.signing) {
            merged = this.beforeRequest.signing(merged)
        }

        if (this.beforeRequest.last) {
            merged = this.beforeRequest.last(merged)
        }
        url = merged.url

        const response = await fetch(url, merged) as JSONResponse<T>
        if (!response.ok) {
            const strHeaders: Record<string, string> = {}
            merged.headers.forEach((v, k) => {
                if (k.toLowerCase().endsWith('-token')) {
                    const tSize = v.length
                    strHeaders[k] = `${v.substring(0, 10)}...${v.substring(tSize - 10, tSize)}`
                } else {
                    strHeaders[k] = v
                }
            })
            const strOpts = JSON.stringify(merged, (k, v) => {
                if (k === 'headers') {
                    return strHeaders
                }
                return v
            })
            const message = `HTTP error received. ${response.status} ${response.statusText}: ${await response.text()}`
                + `Request Opts:\n${strOpts}`
            throw new HttpError(response.status, message)
        }
        response.data = {} as T
        response.raw = await response.blob()
        if (isJsonResponse(response)) {
            if (response.raw.size) {
                response.data = JSON.parse(await response.raw.text())
            }
            // will be validated against own 'schema' field, if one is provided
            const result = validate(response.data, merged.schema)
            if (!result.valid) {
                throw Error(`Failed JSON Schema validation: ${result.errors}`)
            }
        }
        return response
    }

    // eslint-disable-next-line @typescript-eslint/ban-types
    async get<T extends {}>(opts: RequestOptsAbs): Promise<JSONResponse<T>> {
        opts.method = 'GET'
        return await this.request(opts)
    }

    // eslint-disable-next-line @typescript-eslint/ban-types
    async post<T extends {}>(opts: RequestOptsAbs): Promise<JSONResponse<T>> {
        opts.method = 'POST'
        return await this.request(opts)
    }

    // eslint-disable-next-line @typescript-eslint/ban-types
    async put<T extends {}>(opts: RequestOptsAbs): Promise<JSONResponse<T>> {
        opts.method = 'PUT'
        return await this.request(opts)
    }

    async delete(opts: RequestOptsAbs): Promise<JSONResponse<unknown>> {
        opts.method = 'DELETE'
        return await this.request(opts)
    }

    async head(opts: RequestOptsAbs): Promise<JSONResponse<unknown>> {
        opts.method = 'HEAD'
        return await this.request(opts)
    }
}

function isJsonResponse(r: Response): boolean {
    const ct = r.headers.get('content-type')
    if (!ct) {
        return false
    }
    return ct.startsWith('application/json')
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
