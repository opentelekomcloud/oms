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

interface sdkQueryString {
    queryString: string,
    yyyymmdd: string
}

interface queryStringParams {
    accessKeyId: string,
    regionName: string,
    signedHeaders: string,
    serviceName: string,
    isoDate: string
}

interface sdkCanonicalRequest {
    canonicalRequest: string,
    additionalQueryString: string
}

interface canonicalRequestParams {
    method: string,
    url: URL,
    stringifiedHeaders: Array<string>,
    signedHeaders: string,
    body: string
}

interface stringToSignParams {
    iso8601: string,
    yyyymmdd: string,
    regionName: string,
    serviceName: string,
    hash: CryptoJS.lib.WordArray
}

interface signingKeyParams {
    secretAccessKey: string,
    dateStamp: string,
    regionName: string,
    serviceName: string
}

interface authHeaders {
    /* eslint-disable */
    'X-Sdk-Date': string,
    'Authorization': string,
    /* eslint-enable */
}

const SignAlgorithmHMACSHA256 = 'SDK-HMAC-SHA256'

export class Signature {
    getSignHeaders(credentials: credentialInfo, request: requestInfo, date: Date = new Date(), body = ''): authHeaders {
        const dateFormat = /-|:|\..{3}/g
        let currentDate = date.toISOString().replace(dateFormat, '')
        if (!currentDate) {
            currentDate = new Date().toISOString().replace(dateFormat, '')
        }

        // eslint-disable-next-line @typescript-eslint/naming-convention
        const newHeaders = new Headers(request.headers)
        newHeaders.set('Host', request.url.host)
        newHeaders.append('X-Sdk-Date', currentDate)
        const stringifiedHeaders = Signature.sortedStringifiedHeaders(newHeaders)
        const signedHeaders = Signature.getSignedHeaders(stringifiedHeaders)
        const { queryString, yyyymmdd } = Signature.getQueryString({
            accessKeyId: credentials.accessKeyId,
            regionName: credentials.regionName,
            signedHeaders: signedHeaders,
            serviceName: request.serviceName,
            isoDate: currentDate
        })
        const { canonicalRequest, additionalQueryString } = Signature.getCanonicalRequest({
            method: request.method,
            url: request.url,
            stringifiedHeaders: stringifiedHeaders,
            signedHeaders: signedHeaders,
            body: body
        })
        const hash = SHA256(canonicalRequest)
        const stringToSign: string = Signature.getStringToSign({
            iso8601: currentDate,
            yyyymmdd: yyyymmdd,
            regionName: credentials.regionName,
            serviceName: request.serviceName,
            hash: hash
        })
        const signatureKey = Signature.getSigningKey({
            secretAccessKey: credentials.secretAccessKey,
            dateStamp: yyyymmdd,
            regionName: credentials.regionName,
            serviceName: request.serviceName
        })
        const signature = Signature.getSignature(signatureKey, stringToSign)

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
    private static sortedStringifiedHeaders(headers: Headers): Array<string> {
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
    private static getSignedHeaders(stringifiedHeaders: Array<string>): string {
        let signedHeaders = ''
        for (const value of stringifiedHeaders) {
            signedHeaders += value.split(':')[0] + ';'
        }
        return signedHeaders.slice(0, -1)
    }

    /**
     * Get query string
     */
    private static getQueryString(params: queryStringParams): sdkQueryString {
        const yyyymmdd = params.isoDate.slice(0, 8)
        let queryString = SignAlgorithmHMACSHA256
        queryString += ` Credential=${params.accessKeyId}/${yyyymmdd}/${params.regionName}/${params.serviceName}/sdk_request,`
        queryString += ` SignedHeaders=${params.signedHeaders},`
        return { queryString, yyyymmdd }
    }

    /**
     * Get Canonical request.
     */
    private static getCanonicalRequest(params: canonicalRequestParams): sdkCanonicalRequest {
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

    private static getStringToSign(params: stringToSignParams): string {
        return `${SignAlgorithmHMACSHA256}\n${params.iso8601}\n${params.yyyymmdd}/${params.regionName}/${params.serviceName}/sdk_request\n${params.hash.toString()}`
    }

    private static getSigningKey(params: signingKeyParams) {
        try {
            const kDate = HmacSHA256(params.dateStamp, `SDK${params.secretAccessKey}`)
            const kRegion = HmacSHA256(params.regionName, kDate)
            const kService = HmacSHA256(params.serviceName, kRegion)
            return HmacSHA256('sdk_request', kService)
        } catch (e) {
            throw new Error(`Failed to generate signature key: ${e.message}`)
        }
    }

    private static getSignature(keyBuffer: CryptoJS.lib.WordArray, stringToSign: string): string {
        return HmacSHA256(stringToSign, keyBuffer).toString()
    }
}
