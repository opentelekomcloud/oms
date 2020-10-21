import { dateIsoString } from './util'
import { HmacSHA256, SHA256 } from 'crypto-js'

export interface credentialInfo {
    accessKeyId: string,
    secretAccessKey: string,
    regionName: string
}

export interface requestInfo {
    method: string,
    url: URL,
    serviceName: string,
    headers?: Headers,
}

// type httpHeaders = { [key: string]: string }
const SignAlgorithmHMACSHA256 = 'SDK-HMAC-SHA256'


export const getSignedUrl = (
    { accessKeyId, secretAccessKey, regionName }: credentialInfo,
    { method, url, serviceName, headers }: requestInfo, date: Date = new Date(), body = '') => {
    let currentDate = dateIsoString(date)
    if (!currentDate) {
        currentDate = dateIsoString(new Date())
    }

    // eslint-disable-next-line @typescript-eslint/naming-convention
    const newHeaders = new Headers(headers)
    newHeaders.append('Host', url.host)
    newHeaders.append( 'X-Sdk-Date', currentDate )
    const stringifiedHeaders = sortedStringifiedHeaders(newHeaders)
    const signedHeaders = getSignedHeaders(stringifiedHeaders)

    const { queryString, yyyymmdd }: sdkQueryString = getQueryString(accessKeyId, regionName, signedHeaders, serviceName, currentDate)
    const { canonicalRequest, additionalQueryString }: sdkCanonicalRequest = getCanonicalRequest(method, url.pathname, url.searchParams.toString(), stringifiedHeaders, signedHeaders, body)
    const hash = SHA256(canonicalRequest)
    const stringToSign: string = getStringToSign(currentDate, yyyymmdd, regionName, serviceName, hash)
    const signatureKey = getSigningKey(secretAccessKey, yyyymmdd, regionName, serviceName)
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
const sortedStringifiedHeaders = (headers: Headers): Array<string> => {
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
const getSignedHeaders = (stringifiedHeaders: Array<string>): string => {
    let signedHeaders = ''
    for (let i = 0; i < stringifiedHeaders.length; i++) {
        signedHeaders += stringifiedHeaders[i].split(':')[0]
        if (i !== stringifiedHeaders.length - 1) signedHeaders += ';'
    }
    return signedHeaders
}

interface sdkQueryString {
    queryString: string,
    yyyymmdd: string
}

/**
 * Get query string
 */
const getQueryString = (
    accessKeyId: string, regionName: string, signedHeaders: string, serviceName: string, isoDate: string): sdkQueryString => {

    const yyyymmdd = isoDate.slice(0, 8)
    let queryString = SignAlgorithmHMACSHA256
    queryString += ` Credential=${accessKeyId}/${yyyymmdd}/${regionName}/${serviceName}/sdk_request,`
    queryString += ` SignedHeaders=${signedHeaders},`

    return { queryString, yyyymmdd }
}

interface sdkCanonicalRequest {
    canonicalRequest: string,
    additionalQueryString: string
}

/**
 * Get Canonical request.
 */
const getCanonicalRequest = (
    method: string,
    uriPath: string,
    queryString: string,
    stringifledHeaders: Array<string>,
    signedHeaders: string,
    body: string,
): sdkCanonicalRequest => {
    let canonicalRequest = `${method}\n${uriPath}\n${queryString}\n`
    for (let i = 0; i < stringifledHeaders.length; i++) canonicalRequest += `${stringifledHeaders[i]}\n`
    canonicalRequest += `\n${signedHeaders}\n${SHA256(body).toString()}`
    return { canonicalRequest, additionalQueryString: '' }
}

const getStringToSign = (iso8601: string, yyyymmdd: string, regionName: string, serviceName: string, hash: CryptoJS.lib.WordArray): string =>
    `${SignAlgorithmHMACSHA256}\n${iso8601}\n${yyyymmdd}/${regionName}/${serviceName}/sdk_request\n${hash.toString()}`

export const getSigningKey = (
    secretAccessKey: string,
    dateStamp: string,
    regionName: string,
    serviceName: string,
): CryptoJS.lib.WordArray => {
    try {
        const kDate = HmacSHA256(dateStamp, `SDK${secretAccessKey}`)
        const kRegion = HmacSHA256(regionName, kDate)
        const kService = HmacSHA256(serviceName, kRegion)
        return HmacSHA256('sdk_request', kService)
    } catch (e) {
        throw new Error(`Failed to generate signature key: ${e.message}`)
    }
}

export const getSignature = (keyBuffer: CryptoJS.lib.WordArray, stringToSign: string): string => {
    return HmacSHA256(stringToSign, keyBuffer).toString()
}
