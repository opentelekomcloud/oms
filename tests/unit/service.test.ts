import { randomString } from '../utils/helpers';
import HttpClient from '../../src/oms/core/http';
import Service, { bareUrl } from '../../src/oms/services/base';

class FakeService extends Service {
    constructor(url: string, client: HttpClient) {
        super(url, client)
    }
}

test('Service_basic', () => {
    const url = randomString(10)
    const httpClient = new HttpClient()
    const serv = new FakeService(url, httpClient)
    expect(serv.client).toBeDefined()
    expect(serv.client.baseConfig.baseURL).toEqual(url)
})

test('bareUrl', () => {
    const url = 'https://vpc.eu-de.otc.t-systems.com/v2.0/totallyrandomprojectid'
    expect(bareUrl(url)).toEqual('https://vpc.eu-de.otc.t-systems.com')
})
