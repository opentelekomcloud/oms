/**
 * Amazon web services (AWS) Signature version 4.
 * @class Signature
 */

import * as Crypto from 'crypto-js';

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

export class SignatureInputData{
    method?: string;
    service = '';
    host?: string;
    region = '';
    endpoint?: string;
    requestParameters = '';
    contentType = 'text/plain';
    accessKey = '';
    secretKey = '';
    canonicalUri?: string;
    canonicalQuerystring = '';
}


export interface OutSignatureData{
    /* eslint-disable */
    readonly 'Content-Type': string
    readonly 'X-Amz-Date': string
    readonly Authorization: string
    /* eslint-enable */
}

export class Signature {
    /**
     * Generates the signature
     *
     * @param {SignatureInputData} input - structure with data to be signed and keys
     * @param {Date} currentDate - optional parameter to pass custom date
     */
    generateSignature(input: SignatureInputData, currentDate: Date = new Date()): OutSignatureData {
        if (!input) {
            throw Error('Input is missing')
        }
        const {canonicalHeaders, dateStamp, amzDate} =
            Signature.prepareCanonicalHeaders(currentDate, input);
        const {canonicalRequest, signedHeaders} =
            Signature.prepareCanonicalRequest(input, canonicalHeaders);
        const {stringToSign, algorithm, credentialScope} =
            Signature.generateStringToSign(dateStamp, input, amzDate, canonicalRequest);
        const signature = this.signString(input, dateStamp, stringToSign);
        const authorizationHeader = Signature.generateAuthorizationHeader(
            algorithm, input, credentialScope, signedHeaders, signature);

        return {
            'Content-Type': input.contentType,
            'X-Amz-Date': amzDate,
            'Authorization': authorizationHeader
        };
    }

    private static prepareCanonicalHeaders(currentDate: Date, input: SignatureInputData) {
        const amzDate = currentDate.toISOString().replace(/-|:|\..{3}/g, '');
        const dateStamp = amzDate.substr(0, 8);
        const canonicalHeaders = 'content-type:' + input.contentType + '\n' + 'host:'
            + input.host + '\n' + 'x-amz-date:' + amzDate + '\n';
        return {canonicalHeaders, dateStamp, amzDate};
    }

    private static prepareCanonicalRequest(input: SignatureInputData, canonicalHeaders: string) {
        const signedHeaders = 'content-type;host;x-amz-date';
        const payloadHash = Crypto.SHA256(input.requestParameters).toString();
        const canonicalRequest = input.method + '\n' + input.canonicalUri + '\n'
            + input.canonicalQuerystring + '\n' + canonicalHeaders + '\n'
            + signedHeaders + '\n' + payloadHash;
        return {canonicalRequest, signedHeaders};
    }

    private static generateStringToSign(dateStamp: string, input: SignatureInputData, amzDate: string, canonicalRequest: string) {
        const algorithm = 'AWS4-HMAC-SHA256';
        const credentialScope = dateStamp + '/' + input.region + '/'
            + input.service + '/' + 'aws4_request';
        const stringToSign = algorithm + '\n' + amzDate + '\n' + credentialScope +
            '\n' + Crypto.SHA256(canonicalRequest).toString();
        return {stringToSign, algorithm, credentialScope};
    }

    private signString(input: SignatureInputData, dateStamp: string, stringToSign: string) {
        const signingKey = Signature.getSignatureKey(input.secretKey, dateStamp, input.region, input.service);
        const signature = Crypto.HmacSHA256(stringToSign, signingKey).toString();
        return signature;
    }

    private static generateAuthorizationHeader(algorithm: string, input: SignatureInputData, credentialScope: string, signedHeaders: string, signature: any) {
        return algorithm + ' ' + 'Credential=' + input.accessKey + '/'
            + credentialScope + ', ' + 'SignedHeaders=' + signedHeaders
            + ', ' + 'Signature=' + signature;
    }

    private static getSignatureKey(
        key: string,
        dateStamp: string,
        regionName: string,
        serviceName: string): any
    {
        const kDate = Crypto.HmacSHA256(dateStamp, 'AWS4' + key);
        const kRegion = Crypto.HmacSHA256(regionName, kDate);
        const kService = Crypto.HmacSHA256(serviceName, kRegion);
        const kSigning = Crypto.HmacSHA256('aws4_request', kService);
        return kSigning;
    }
}

// function canonicalRequest(config: RequestOpts): string {
//     const url = new URL(config.url, config.baseURL)
//     const queryString = url.search.substring(1)
//     const canonHeaders = Object.entries(config.headers).map(e => `${e[0].toLowerCase()}:${e[1].trim()}\n`).sort().join('')
//     const signedHeaders = Object.keys(config.headers).sort((a: string, b: string): number => (a[0].toLowerCase() < b[0].toLowerCase() ? -1 : 1)).join(';')
//     const hash = hexEncode(sha256(config.body!))
//     return `${config.method}\n${url.pathname}\n${queryString}\n${canonHeaders}\n${signedHeaders}\n${hash}`
// }
//
// function hexEncode(s: string) {
//     let hex; let i
//     let result = ''
//     for (i = 0; i < s.length; i++) {
//         hex = s.charCodeAt(i).toString(16)
//         result += (`000${hex}`).slice(-4)
//     }
//     return result
// }
//
// export function signRequest(access: string, secret: string) {
//     return function (config: RequestOpts): RequestOpts {
//         config.headers.set('X-Amz-Date', new Date()
//             .toISOString()
//             .replace(/[:\-]|\.\d{3}/, ''))
//         config.headers.set('Authorization', canonicalRequest(config))
//         return config
//     }
// }
