import { getSignedUrl } from '../../src/oms/core'

test('aws-signature test', () => {
    const myUrl = new URL('http://host.foo.com/%20/foo')
    const date = new Date('Fri, 09 Sep 2011 23:36:00 GMT')
    const signedUrlGet = getSignedUrl(
        {
            accessKeyId: 'AKIDEXAMPLE',
            secretAccessKey: 'wJalrXUtnFEMI/K7MDENG+bPxRfiCYEXAMPLEKEY',
            regionName: 'cn-north-1'
        },
        {
            method: 'GET',
            hostName: myUrl.host,
            serviceName: 'host',
            uriPath: myUrl.pathname,
        },
        date
    );
    expect(signedUrlGet.Authorization).toBe(
        'SDK-HMAC-SHA256 Credential=AKIDEXAMPLE/20110909/cn-north-1/host/sdk_request,' +
        ' SignedHeaders=host;x-sdk-date,' +
        ' Signature=c11b63b04ae21a93d0de7e4702033153d3322f11b67cceca98b33af3100840e8')

})
