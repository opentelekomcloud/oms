import {AxiosRequestConfig} from 'axios';
import {sha256} from "js-sha256";

// const algorithm = 'AWS4-HMAC-SHA256'

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
    const hash = hexEncode(sha256(JSON.stringify(config.data)))
    return `${config.method}\n${url.pathname}\n${queryString}\n${canonHeaders}\n${signedHeaders}\n${hash}`
}

function hexEncode(s: string) {
    let hex, i;
    let result = "";
    for (i = 0; i < s.length; i++) {
        hex = s.charCodeAt(i).toString(16);
        result += ("000" + hex).slice(-4);
    }

    return result
}

export function setUserAgent(config: AxiosRequestConfig): AxiosRequestConfig {
    config.headers['user-agent'] = 'OpenTelekomCloud JS/0.1'
    return config
}

export function signRequest(access: string, secret: string): (config: AxiosRequestConfig) => AxiosRequestConfig {
    return function (config: AxiosRequestConfig): AxiosRequestConfig {
        config = setUserAgent(config)

        config.headers['X-Amz-Date'] = new Date()
            .toISOString()
            .replace(/[:\-]|\.\d{3}/, '')
        // FIXME: this is not a real signing but just a stub
        config.headers['Authorization'] = canonicalRequest(config)
        return config
    }
}
