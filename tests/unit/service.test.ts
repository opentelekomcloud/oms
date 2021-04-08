import { randomString } from '../utils/helpers'
import HttpClient from '../../src/oms/core/http'
import Service from '../../src/oms/services/base'

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
