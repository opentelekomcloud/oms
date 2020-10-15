/**
 * Amazon web services (AWS) Signature version 4.
 * @class Signature
 */

import { sha256 } from 'js-sha256';

export interface SignatureInputData{
    method: string,
    service: string,
    host: string,
    region: string,
    endpoint?: string;
    requestParameters: string;
    contentType: string;
    accessKey: string;
    secretKey: string;
    canonicalUri: string;
    canonicalQuerystring: string;
}


export interface SignatureOutputData{
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
    generateSignature(input: SignatureInputData, currentDate: Date = new Date()): SignatureOutputData {
        if (!input) {
            throw Error('Input is missing')
        }
        const { canonicalHeaders, dateStamp, amzDate } =
            Signature.prepareCanonicalHeaders(currentDate, input);
        const { canonicalRequest, signedHeaders } =
            Signature.prepareCanonicalRequest(input, canonicalHeaders);
        const { stringToSign, algorithm, credentialScope } =
            Signature.generateStringToSign(dateStamp, input, amzDate, canonicalRequest);
        const signature = Signature.signString(input, dateStamp, stringToSign);
        const authorizationHeader = Signature.generateAuthorizationHeader(
            algorithm, input, credentialScope, signedHeaders, signature);

        return {
            /* eslint-disable */
            'Content-Type': input.contentType,
            'X-Amz-Date': amzDate,
            'Authorization': authorizationHeader
            /* eslint-enable */
        };
    }

    private static prepareCanonicalHeaders(currentDate: Date, input: SignatureInputData) {
        const amzDate = currentDate.toISOString().replace(/-|:|\..{3}/g, '');
        const dateStamp = amzDate.substr(0, 8);
        const canonicalHeaders = `content-type:${input.contentType}\nhost:${input.host}\nx-amz-date:${amzDate}\n`;
        return { canonicalHeaders, dateStamp, amzDate };
    }

    private static prepareCanonicalRequest(input: SignatureInputData, canonicalHeaders: string) {
        const signedHeaders = 'content-type;host;x-amz-date';
        const payloadHash = sha256(input.requestParameters).toString();
        const canonicalRequest = `${input.method}\n${input.canonicalUri}\n${input.canonicalQuerystring}\n${canonicalHeaders}\n${signedHeaders}\n${payloadHash}`;
        return { canonicalRequest, signedHeaders };
    }

    private static generateStringToSign(dateStamp: string, input: SignatureInputData, amzDate: string, canonicalRequest: string) {
        const algorithm = 'AWS4-HMAC-SHA256';
        const credentialScope = `${dateStamp}/${input.region}/${input.service}/aws4_request`
        const stringToSign = `${algorithm}\n${amzDate}\n${credentialScope}\n${sha256(canonicalRequest).toString()}`
        return { stringToSign, algorithm, credentialScope }
    }

    private static signString(input: SignatureInputData, dateStamp: string, stringToSign: string) {
        const signingKey = Signature.getSignatureKey(input.secretKey, dateStamp, input.region, input.service)
        return sha256.hmac(stringToSign, signingKey).toString()
    }

    private static generateAuthorizationHeader(algorithm: string, input: SignatureInputData, credentialScope: string, signedHeaders: string, signature: any) {
        return `${algorithm} Credential=${input.accessKey}/${credentialScope}, SignedHeaders=${signedHeaders}, Signature=${signature}`
    }

    private static getSignatureKey(
        key: string,
        dateStamp: string,
        regionName: string,
        serviceName: string): any
    {
        const kDate = sha256.hmac(dateStamp, 'AWS4' + key)
        const kRegion = sha256.hmac(regionName, kDate)
        const kService = sha256.hmac(serviceName, kRegion)
        return sha256.hmac('aws4_request', kService)
    }
}
