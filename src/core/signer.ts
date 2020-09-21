import {AxiosRequestConfig} from 'axios';
import {sha256} from "js-sha256";

const algorithm = 'AWS4-HMAC-SHA256'

// Build a CanonicalRequest from a regular request string
//
// See http://docs.aws.amazon.com/general/latest/gr/sigv4-create-canonical-request.html
// CanonicalRequest =
//  HTTPRequestMethod + '\n' +
//  CanonicalURI + '\n' +
//  CanonicalQueryString + '\n' +
//  CanonicalHeaders + '\n' +
//  SignedHeaders + '\n' +
//  HexEncode(Hash(RequestPayload))
function canonicalRequest(config: AxiosRequestConfig): string {
    const url = new URL(<string>config.url, config.baseURL)
    const queryString = url.search.substring(1)
    const canonHeaders = Object.entries(config.headers).map((e: any) => {
        return `${e[0].toLowerCase()}:${e[1].trim()}\n`
    }).sort().join('')
    const signedHeaders = Object.keys(config.headers).sort((a: string, b: string): number => {
        return a[0].toLowerCase() < b[0].toLowerCase() ? -1 : 1;
    }).join(';')
    const hash = sha256(JSON.stringify(config.data))
    return `${config.method}\n${url.pathname}\n${queryString}\n${canonHeaders}\n${signedHeaders}\n`
}

export function SetUserAgent(config: AxiosRequestConfig): AxiosRequestConfig {
    config.headers['user-agent'] = 'OpenTelekomCloud JS/0.1'
    return config
}


export function akskInterceptor(access: string, secret: string): (config: AxiosRequestConfig) => AxiosRequestConfig {
    return function (config: AxiosRequestConfig): AxiosRequestConfig {
        config = SetUserAgent(config)

        const datetime = new Date().toISOString().replace(/[:\-]|\.\d{3}/, '')
        config.headers['X-Amz-Date'] = datetime
        config.headers['Authorization'] = ''

        return config
    }
}
