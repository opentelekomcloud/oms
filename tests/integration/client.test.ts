import { cloudConfig, CloudConfig } from '../../src/oms/core'
import { authServerUrl, fakeAuthServer, fakeRegion, fakeServiceServer, fakeToken } from '../utils/servers'
import { Client, IdentityV3 } from '../../src/oms'
import { randomString } from '../utils/helpers'
import Service from '../../src/oms/services/base'
import HttpClient from '../../src/oms/core/http'
import { disableFetchMocks, enableFetchMocks } from 'jest-fetch-mock'

beforeAll(() => {
    fakeAuthServer.listen()
    fakeServiceServer.listen()
    enableFetchMocks()
})

afterAll(() => {
    fakeAuthServer.close()
    fakeServiceServer.close()
    disableFetchMocks()
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

    class Pseudo extends Service {
        static version = srv.version
        static type = srv.type

        constructor(url: string, client: HttpClient) {
            super(url, client)
        }
    }

    const ps = client.getService(Pseudo)
    expect(ps).toBeDefined()
    expect(ps.client.baseConfig.baseURL).toBe(srv.url)
})

test.skip('Client: get not registered service', async () => {
    const cfg = cloudConfig(authServerUrl())
        .withPassword('MYDOMAIN', 'MYNAME', '>>>Super!Secret<<<', fakeRegion)
        .config
    const client = new Client(cfg)
    await client.authenticate()

    class Pseudo extends Service {
        static version = srv.version
        static type = srv.type

        constructor(url: string, client: HttpClient) {
            super(url, client)
        }
    }

    expect(() => client.getService(Pseudo)).toThrowError()
})

test('Client: no auth opts', async () => {
    const cfg = new CloudConfig()
    const client = new Client(cfg)
    await expect(client.authenticate()).rejects.toThrowError()
})

test.skip('Client: no ak/sk opts', async () => {
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


test('Client: ak/sk auth; request headers', async () => {
    const ak = randomString(10)
    const sk = randomString(20)
    const configAkSk = cloudConfig('http://t-systems.com')
        .withAKSK(ak, sk, 'eu-de')
        .config
    const clientAkSk = new Client(configAkSk)
    const projectID = randomString(20)
    const domainID = randomString(20)
    fetchMock.mockOnce(async req => {
        expect(req.url.endsWith('?name=eu-de')).toBeTruthy()
        return `{"projects": [{ "id": "${projectID}", "domain_id": "${domainID}" }]}`
    })
    await clientAkSk.authenticate()
    fetchMock.mockOnce(async req => {
        expect(req.headers.get('x-sdk-date')).toBeTruthy()
        expect(req.headers.get('x-domain-id')).toBe(domainID)
        expect(req.headers.get('x-project-id')).toBe(projectID)
        expect(req.headers.get('authorization')).toBeTruthy()
        expect(req.headers.get('authorization')!.startsWith('SDK-HMAC-SHA256 Credential=')).toBeTruthy()
        return ''
    })
    const iam = clientAkSk.getService(IdentityV3)
    await iam.listProjects()
})
