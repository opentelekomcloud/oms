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

interface sdkQueryString {
    queryString: string,
    yyyymmdd: string
}

interface sdkCanonicalRequest {
    canonicalRequest: string,
    additionalQueryString: string
}

const SignAlgorithmHMACSHA256 = 'SDK-HMAC-SHA256'

export class Signature {
    getSignedUrl = (credentials: credentialInfo, request: requestInfo, date: Date = new Date(), body = '') => {
        let currentDate = dateIsoString(date)
        if (!currentDate) {
            currentDate = dateIsoString(new Date())
        }

        // eslint-disable-next-line @typescript-eslint/naming-convention
        const newHeaders = new Headers(request.headers)
        newHeaders.set('Host', request.url.host)
        newHeaders.append('X-Sdk-Date', currentDate)
        const stringifiedHeaders = this.sortedStringifiedHeaders(newHeaders)
        const signedHeaders = this.getSignedHeaders(stringifiedHeaders)
        const { queryString, yyyymmdd } = this.getQueryString(credentials.accessKeyId, credentials.regionName, signedHeaders, request.serviceName, currentDate)
        const { canonicalRequest, additionalQueryString } = this.getCanonicalRequest(request.method, request.url.pathname, request.url.searchParams.toString(), stringifiedHeaders, signedHeaders, body)
        const hash = SHA256(canonicalRequest)
        const stringToSign: string = this.getStringToSign(currentDate, yyyymmdd, credentials.regionName, request.serviceName, hash)
        const signatureKey = this.getSigningKey(credentials.secretAccessKey, yyyymmdd, credentials.regionName, request.serviceName)
        const signature = this.getSignature(signatureKey, stringToSign)

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
    private sortedStringifiedHeaders = (headers: Headers): Array<string> => {
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
    private getSignedHeaders = (stringifiedHeaders: Array<string>): string => {
        let signedHeaders = ''
        for (let i = 0; i < stringifiedHeaders.length; i++) {
            signedHeaders += stringifiedHeaders[i].split(':')[0]
            if (i !== stringifiedHeaders.length - 1) signedHeaders += ';'
        }
        return signedHeaders
    }

    /**
     * Get query string
     */
    private getQueryString = (
        accessKeyId: string,
        regionName: string,
        signedHeaders: string,
        serviceName: string,
        isoDate: string
    ): sdkQueryString => {
        const yyyymmdd = isoDate.slice(0, 8)
        let queryString = SignAlgorithmHMACSHA256
        queryString += ` Credential=${accessKeyId}/${yyyymmdd}/${regionName}/${serviceName}/sdk_request,`
        queryString += ` SignedHeaders=${signedHeaders},`
        return { queryString, yyyymmdd }
    }

    /**
     * Get Canonical request.
     */
    private getCanonicalRequest = (
        method: string,
        uriPath: string,
        queryString: string,
        stringifiedHeaders: Array<string>,
        signedHeaders: string,
        body: string
    ): sdkCanonicalRequest => {
        if (!uriPath) {
            uriPath = '/'
        }
        if (!uriPath.endsWith('/')) {
            uriPath += '/'
        }
        if (!uriPath.startsWith('/')) {
            uriPath = '/' + uriPath
        }
        let canonicalRequest = `${method}\n${uriPath}\n${queryString}\n`
        for (let i = 0; i < stringifiedHeaders.length; i++) canonicalRequest += `${stringifiedHeaders[i]}\n`
        canonicalRequest += `\n${signedHeaders}\n${SHA256(body).toString()}`
        return { canonicalRequest, additionalQueryString: '' }
    }

    private getStringToSign = (
        iso8601: string,
        yyyymmdd: string,
        regionName: string,
        serviceName: string,
        hash: CryptoJS.lib.WordArray
    ): string => {
        return `${SignAlgorithmHMACSHA256}\n${iso8601}\n${yyyymmdd}/${regionName}/${serviceName}/sdk_request\n${hash.toString()}`
    }

    private getSigningKey = (
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

    private getSignature = (keyBuffer: CryptoJS.lib.WordArray, stringToSign: string): string => {
        return HmacSHA256(stringToSign, keyBuffer).toString()
    }
}
