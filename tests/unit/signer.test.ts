import { Signature, SignatureInputData } from '../../src/oms/core'

test('aws-signature correct signature', () => {
    const myHeaders = new Headers();
    myHeaders.append( 'content-type', 'application/json')
    const myUrl = new URL('http://test-api.com/api/canonical/1')
    const data: SignatureInputData = {
        method: 'POST',
        region: 'eu-de',
        service: 'crs',
        accessKey: 'BmZtmqwC4PPLkWdk20fgr4ehJK1KJqIZtkCGkVPc',
        secretKey: 'GKHYPTS41PKM6UPVJTSX',
        requestBody: '{"key":"value"}',
        headers: myHeaders,
        url: myUrl
    }
    const signingTool = new Signature()
    const date = new Date('2020-10-15:01:00Z')
    const output = signingTool.generateSignature(data, date)
    expect(output['Content-Type']).toBe('application/json')
    expect(output['X-Amz-Date']).toBe('20201015T010000Z')
    expect(output['Authorization']).toBe(
        'AWS4-HMAC-SHA256 Credential=BmZtmqwC4PPLkWdk20fgr4ehJK1KJqIZtkCGkVPc/' +
        '20201015/eu-de/crs/aws4_request, SignedHeaders=content-type;host;x-amz-date,' +
        ' Signature=2d822e4b474d31f04c1503d9202eb6f99d2e79a7f4d7dc58e7d3fb6dea1278d5')
})
