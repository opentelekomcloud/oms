import { HmacSHA256, SHA256 } from 'crypto-js'

export interface CredentialInfo {
    readonly accessKeyId: string,
    readonly secretAccessKey: string,
    readonly regionName: string
}

export interface RequestInfo {
    readonly method: string,
    readonly url: URL,
    readonly serviceName: string,
    readonly headers?: Headers,
}

export interface AuthHeaders {
    /* eslint-disable */
    readonly 'X-Sdk-Date': string,
    readonly 'Authorization': string,
    /* eslint-enable */
}

interface QueryString {
    readonly queryString: string,
    readonly yyyymmdd: string
}

interface QueryStringParams {
    readonly accessKeyId: string,
    readonly regionName: string,
    readonly signedHeaders: string,
    readonly serviceName: string,
    readonly isoDate: string
}

interface CanonicalRequest {
    readonly canonicalRequest: string,
    readonly additionalQueryString: string
}

interface CanonicalRequestParams {
    readonly method: string,
    readonly url: URL,
    readonly stringifiedHeaders: string[],
    readonly signedHeaders: string,
    readonly body: string
}

interface StringToSignParams {
    readonly iso8601: string,
    readonly yyyymmdd: string,
    readonly regionName: string,
    readonly serviceName: string,
    readonly hash: CryptoJS.lib.WordArray
}

interface SigningKeyParams {
    readonly secretAccessKey: string,
    readonly dateStamp: string,
    readonly regionName: string,
    readonly serviceName: string
}

const SignAlgorithmHMACSHA256 = 'SDK-HMAC-SHA256'
const DateFormat = /-|:|\..{3}/g

export function getSignHeaders(credentials: CredentialInfo, request: RequestInfo, date: Date = new Date(), body = ''): AuthHeaders {
    let currentDate = date.toISOString().replace(DateFormat, '')
    if (!currentDate) {
        currentDate = new Date().toISOString().replace(DateFormat, '')
    }
    const newHeaders = new Headers(request.headers)
    newHeaders.set('Host', request.url.host)
    newHeaders.append('X-Sdk-Date', currentDate)
    const stringifiedHeaders = sortedStringifiedHeaders(newHeaders)
    const signedHeaders = getSignedHeaders(stringifiedHeaders)
    const { queryString, yyyymmdd } = getQueryString({
        accessKeyId: credentials.accessKeyId,
        regionName: credentials.regionName,
        signedHeaders: signedHeaders,
        serviceName: request.serviceName,
        isoDate: currentDate,
    })
    const { canonicalRequest, additionalQueryString } = getCanonicalRequest({
        method: request.method,
        url: request.url,
        stringifiedHeaders: stringifiedHeaders,
        signedHeaders: signedHeaders,
        body: body,
    })
    const hash = SHA256(canonicalRequest)
    const stringToSign: string = getStringToSign({
        iso8601: currentDate,
        yyyymmdd: yyyymmdd,
        regionName: credentials.regionName,
        serviceName: request.serviceName,
        hash: hash,
    })
    const signatureKey = getSigningKey({
        secretAccessKey: credentials.secretAccessKey,
        dateStamp: yyyymmdd,
        regionName: credentials.regionName,
        serviceName: request.serviceName,
    })
    const signature = getSignature(signatureKey, stringToSign)

    return {
        /* eslint-disable */
        'X-Sdk-Date': currentDate,
        'Authorization': `${queryString}${additionalQueryString} Signature=${signature}`,
        /* eslint-enable */
    }
}

/**
 * Stringify and sort http headers
 * @returns {Array<string>}
 */
function sortedStringifiedHeaders(headers: Headers): string[] {
    const result: string[] = []
    headers.forEach((v, k) => {
        result.push(`${k.toLowerCase()}:${v}`)
    })
    return result.sort()
}

/**
 * Get signed headers
 * @param stringifiedHeaders {Array<string>}
 * @returns {string}
 */
function getSignedHeaders(stringifiedHeaders: string[]): string {
    let signedHeaders = ''
    for (const value of stringifiedHeaders) {
        signedHeaders += value.split(':')[0] + ';'
    }
    return signedHeaders.slice(0, -1)
}

/**
 * Get query string
 */
function getQueryString(params: QueryStringParams): QueryString {
    const yyyymmdd = params.isoDate.slice(0, 8)
    let queryString = SignAlgorithmHMACSHA256
    queryString += ` Credential=${params.accessKeyId}/${yyyymmdd}/${params.regionName}/${params.serviceName}/sdk_request,`
    queryString += ` SignedHeaders=${params.signedHeaders},`
    return { queryString, yyyymmdd }
}

/**
 * Get Canonical request.
 */
function getCanonicalRequest(params: CanonicalRequestParams): CanonicalRequest {
    if (!params.url.pathname) {
        params.url.pathname = '/'
    }
    if (!params.url.pathname.endsWith('/')) {
        params.url.pathname += '/'
    }
    if (!params.url.pathname.startsWith('/')) {
        params.url.pathname = '/' + params.url.pathname
    }
    let canonicalRequest = `${params.method}\n${params.url.pathname}\n${params.url.searchParams.toString()}\n`
    for (const value of params.stringifiedHeaders) {
        canonicalRequest += `${value}\n`
    }
    canonicalRequest += `\n${params.signedHeaders}\n${SHA256(params.body).toString()}`
    return { canonicalRequest, additionalQueryString: '' }
}

function getStringToSign(params: StringToSignParams): string {
    return `${SignAlgorithmHMACSHA256}\n${params.iso8601}\n${params.yyyymmdd}/${params.regionName}/${params.serviceName}/sdk_request\n${params.hash.toString()}`
}

function getSigningKey(params: SigningKeyParams) {
    try {
        const kDate = HmacSHA256(params.dateStamp, `SDK${params.secretAccessKey}`)
        const kRegion = HmacSHA256(params.regionName, kDate)
        const kService = HmacSHA256(params.serviceName, kRegion)
        return HmacSHA256('sdk_request', kService)
    } catch (e) {
        throw new Error(`Failed to generate signature key: ${e.message}`)
    }
}

function getSignature(keyBuffer: CryptoJS.lib.WordArray, stringToSign: string): string {
    return HmacSHA256(stringToSign, keyBuffer).toString()
}
