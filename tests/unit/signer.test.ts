import { getSignedUrl } from '../../src/oms/core'

test('aws-signature test', () => {
    const myUrl = new URL('https://iam.eu-de.otc.t-systems.com/v3/projects/?name=eu-de_test_dmd')
    const date = new Date('Mon, 19 Oct 2020 13:22:12 GMT')
    const headers = new Headers()
    headers.append('accept', 'application/json')
    headers.append( 'user-agent', 'golangsdk/2.0.0' )
    const signedUrlGet = getSignedUrl(
        {
            accessKeyId: 'A2VGRDT4L5Z7YOYSTNN9',
            secretAccessKey: 'BYBYIiF3WUZGlorXmcTEDtNjB40JTibYIEfSUWqA',
            regionName: ''
        },
        {
            method: 'GET',
            url: myUrl,
            serviceName: '',
            headers: headers,
        },
        date
    );
    expect(signedUrlGet.Authorization).toBe(
        'SDK-HMAC-SHA256 Credential=A2VGRDT4L5Z7YOYSTNN9/20201019///sdk_request,' +
        ' SignedHeaders=accept;host;user-agent;x-sdk-date,' +
        ' Signature=446f60d99021ad562739f1a841a242b708237d62ed5d278d882abcfea8b0428b')
})
