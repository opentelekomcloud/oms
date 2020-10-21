import { Signature } from '../../src/oms/core'


test('aws-signature test', () => {
    const myUrl = new URL('https://iam.eu-de.otc.t-systems.com/v3/projects?name=eu-de_test_dmd')
    const date = new Date('Wed, 21 Oct 2020 11:54:11 GMT')
    const headers = new Headers()
    headers.set('accept', 'application/json')
    headers.set( 'user-agent', 'OpenTelekomCloud JS/v1.0' )
    headers.set( 'content-type', 'application/json' )
    const signature = new Signature()
    const signedUrlGet = signature.getSignHeaders(
        {
            accessKeyId: 'AKIDEXAMPLE',
            secretAccessKey: 'BYBYIiF3WUZGlorXmcTEDtNjB40JTibEXAMPLE',
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
        'SDK-HMAC-SHA256 Credential=AKIDEXAMPLE/20201021///sdk_request,' +
        ' SignedHeaders=accept;content-type;host;user-agent;x-sdk-date,' +
        ' Signature=cb8397a6b119b38e8a4879f342e498896eb6f80f4c3cdebfd400cb2298d8a555')
})
