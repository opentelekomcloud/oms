import { cloudConfig, CloudConfig } from '../../src/oms/core'
import { authServerUrl, fakeAuthServer, fakeRegion, fakeServiceServer, fakeToken } from '../utils/servers'
import { Client } from '../../src/oms'
import { randomString } from '../utils/helpers'
import Service from '../../src/oms/services/base'
import HttpClient from '../../src/oms/core/http'

beforeAll(() => {
    fakeAuthServer.listen()
    fakeServiceServer.listen()
})

afterAll(() => {
    fakeAuthServer.close()
    fakeServiceServer.close()
})

test.skip('Client: authToken', async () => {
    const cfg = cloudConfig(authServerUrl())
        .withPassword('MYDOMAIN', 'MYNAME', '>>>Super!Secret<<<', fakeRegion)
        .config
    const client = new Client(cfg)
    await client.authToken()
})

test('Client: authAKSK', async () => {
    const cfg = cloudConfig(authServerUrl())
        .withAKSK('AK', 'SK')
        .config
    const client = new Client(cfg)
    await client.authAkSk()
})

const srv = {
    type: randomString(5),
    version: 'v6',
    url: 'https://' + randomString(12),
}

test('Client: register service', () => {
    const cfg = cloudConfig(authServerUrl())
        .withToken(fakeToken)
        .config
    const client = new Client(cfg)
    client.registerService(srv.type, srv.url)

    class pseudo extends Service {
        static version = srv.version
        static type = srv.type

        constructor(url: string, client: HttpClient) {
            super(url, client)
        }
    }

    const ps = client.getService(pseudo)
    expect(ps).toBeDefined()
    expect(ps.client.baseConfig.baseURL).toBe(srv.url)
})

test.skip('Client: get not registered service', async () => {
    const cfg = cloudConfig(authServerUrl())
        .withPassword('MYDOMAIN', 'MYNAME', '>>>Super!Secret<<<', fakeRegion)
        .config
    const client = new Client(cfg)
    await client.authenticate()

    class pseudo extends Service {
        static version = srv.version
        static type = srv.type

        constructor(url: string, client: HttpClient) {
            super(url, client)
        }
    }

    expect(() => client.getService(pseudo)).toThrowError()
})

test('Client: no auth opts', async () => {
    const cfg = new CloudConfig()
    const client = new Client(cfg)
    await expect(client.authenticate()).rejects.toThrowError()
})

test('Client: no ak/sk opts', async () => {
    const cfg = { auth: { auth_url: 'http://notempty' } }
    const client = new Client(cfg)
    await expect(client.authAkSk()).rejects.toThrowError()
})

test.skip('Client: ak/sk opts', async () => {
    const cfg = cloudConfig('http://nsdfdf')
        .withAKSK(randomString(10), randomString(20))
        .config
    const client = new Client(cfg)
    client.authAkSk = jest.fn()
    client.saveServiceCatalog = jest.fn()
    await client.authenticate()
    expect(client.authAkSk).toBeCalled()
})

test('Client: abs URL', async () => {
    const cfg = cloudConfig(authServerUrl()).config
    const client = new Client(cfg)
    await client.httpClient.get({ url: authServerUrl() })
})

test('Client: abs URL with base', async () => {
    const cfg = cloudConfig(authServerUrl())
        .config
    const client = new Client(cfg)
    await client.httpClient.get({ url: authServerUrl(), baseURL: 'https://google.com' })
})

test('Client: merge handlers', async () => {
    const cfg = cloudConfig(authServerUrl()).config
    const client = new Client(cfg)
    const mock1 = jest.fn()
    const mock2 = jest.fn()
    client.httpClient.beforeRequest.push(opts => {
        mock1()
        return opts
    })
    await client.httpClient.get({
        url: authServerUrl(),
        handler: opts => {
            mock2()
            return opts
        },
    })
    expect(mock1).toBeCalledTimes(1)
    expect(mock2).toBeCalledTimes(1)
})
