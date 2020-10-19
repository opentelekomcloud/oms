import { Signature, SignatureInputData } from '../../src/oms/core'

test('aws-signature correct signature', () => {
    const myHeaders = new Headers();
    myHeaders.append( 'content-type','application/x-www-form-urlencoded; charset=utf8')
    const myUrl = new URL('http://host.foo.com/')
    const data: SignatureInputData = {
        method: 'POST',
        region: 'cn-north-1',
        service: 'host',
        accessKey: 'AKIDEXAMPLE',
        secretKey: 'wJalrXUtnFEMI/K7MDENG+bPxRfiCYEXAMPLEKEY',
        url: myUrl,
        headers: myHeaders,
        requestBody: 'foo=bar'
    }
    const signingTool = new Signature()
    const date = new Date('Fri, 09 Sep 2011 23:36:00 GMT')
    const output = signingTool.generateSignature(data, date)
    expect(output['Content-Type']).toBe('application/x-www-form-urlencoded; charset=utf8')
    expect(output['X-Sdk-Date']).toBe('20110909T233600Z')
    expect(output['Authorization']).toBe(
        'SDK-HMAC-SHA256 Credential=AKIDEXAMPLE/' +
        '20110909/cn-north-1/host/sdk_request, SignedHeaders=content-type;date;host,' +
        ' Signature=81a7a27bd8500c271145b269e50ebee0f0fe9a51c89ce506cfa33e4a07e51a17')
})
