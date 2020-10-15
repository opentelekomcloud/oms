import { Signature, SignatureInputData } from '../../src/oms/core'

test('aws-signature correct signature', () => {
    const data: SignatureInputData = {
        method: 'POST',
        canonicalUri: '/api/canonical/1',
        host: 'test-api.com',
        region: 'eu-de',
        service: 'crs',
        accessKey: 'BmZtmqwC4PPLkWdk20fgr4ehJK1KJqIZtkCGkVPc',
        secretKey: 'GKHYPTS41PKM6UPVJTSX',
        contentType: 'application/json',
        requestParameters: '{"key":"value"}',
        canonicalQuerystring: ''
    }
    const signingTool = new Signature()
    const date = new Date('2020-10-15:01:00Z')
    const output = signingTool.generateSignature(data, date)
    expect(output['Content-Type']).toBe('application/json')
    expect(output['X-Amz-Date']).toBe('20201015T010000Z')
    expect(output['Authorization']).toBe(
        'AWS4-HMAC-SHA256 Credential=BmZtmqwC4PPLkWdk20fgr4ehJK1KJqIZtkCGkVPc/' +
        '20201015/eu-de/crs/aws4_request, SignedHeaders=content-type;host;x-amz-date,' +
        ' Signature=2cd530a15d8edf2889136672b5ddf141c82be80bc860fbc5a6fd7434abe55c71')
})
