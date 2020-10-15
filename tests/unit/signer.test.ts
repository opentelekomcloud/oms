import {Signature, SignatureInputData} from "../../src/oms/core";

test('aws-signature tests', () => {
    function prepareSignatureInput(): SignatureInputData {
        const awsSignatureInputData = new SignatureInputData();
        awsSignatureInputData.method = 'POST';
        awsSignatureInputData.canonicalUri = '/api/canonical/1';
        awsSignatureInputData.host = 'test-api.com';
        awsSignatureInputData.region = 'eu-de';
        awsSignatureInputData.service = 'crs';
        awsSignatureInputData.accessKey = 'BmZtmqwC4PPLkWdk20fdhf3hJK1KJqIZtkCGkVPc';
        awsSignatureInputData.secretKey = 'VFBPWLH41PKM6UPVJTSX';
        awsSignatureInputData.contentType = 'application/json';
        awsSignatureInputData.requestParameters = '{"key":"value"}';
        awsSignatureInputData.canonicalQuerystring = '';
        return awsSignatureInputData;
    }

    const signingTool = new Signature();

    const data = prepareSignatureInput();
    const date = new Date('2020-10-15:01:00Z');
    const output = signingTool.generateSignature(data, date);
    expect(output['Content-Type']).toBe('application/json');
    expect(output['X-Amz-Date']).toBe('20201015T010000Z');
    expect(output['Authorization']).toBe('');
})
