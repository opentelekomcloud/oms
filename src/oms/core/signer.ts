import { sha256 } from 'js-sha256';
import { RequestOpts } from './http';

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
function canonicalRequest(config: RequestOpts): string {
    const url = new URL(config.url, config.baseURL)
    const queryString = url.search.substring(1)
    const canonHeaders = Object.entries(config.headers).map(e => `${e[0].toLowerCase()}:${e[1].trim()}\n`).sort().join('')
    const signedHeaders = Object.keys(config.headers).sort((a: string, b: string): number => (a[0].toLowerCase() < b[0].toLowerCase() ? -1 : 1)).join(';')
    const hash = hexEncode(sha256(config.text))
    return `${config.method}\n${url.pathname}\n${queryString}\n${canonHeaders}\n${signedHeaders}\n${hash}`
}

function hexEncode(s: string) {
    let hex; let
        i;
    let result = '';
    for (i = 0; i < s.length; i++) {
        hex = s.charCodeAt(i).toString(16);
        result += (`000${hex}`).slice(-4);
    }

    return result
}

export function signRequest(access: string, secret: string) {
    return function (config: RequestOpts): RequestOpts {
        config.headers.set('X-Amz-Date', new Date()
            .toISOString()
            .replace(/[:\-]|\.\d{3}/, ''))
        // FIXME: this is not a real signing but just a stub
        config.headers.set('Authorization', canonicalRequest(config))
        return config
    }
}
