import { CloudConfig, CloudConfigHelper } from '../../src/oms/core/types'
import { authServerUrl, fakeAuthServer, fakeRegion, fakeServiceServer, fakeToken } from '../utils/servers'
import Client from '../../src/oms/client'
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

test('Client: authToken', async () => {
    const cfg = new CloudConfigHelper(authServerUrl())
        .simplePasswordConfig('MYDOMAIN', 'MYNAME', '>>>Super!Secret<<<', fakeRegion)
    const client = new Client(cfg)
    await client.authToken()
})

test('Client: authAKSK', () => {
    const cfg = new CloudConfigHelper(authServerUrl())
        .simpleAkSkConfig('AK', 'SK')
    const client = new Client(cfg)
    client.authAkSk()
})

const srv = {
    type: randomString(5),
    version: 'v6',
    url: 'https://' + randomString(12),
}

test('Client: register service', () => {
    const cfg = new CloudConfigHelper(authServerUrl())
        .simpleTokenConfig(fakeToken)
    const client = new Client(cfg)
    client.registerService(srv.type, srv.version, srv.url)

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

test('Client: get not registered service', async () => {
    const cfg = new CloudConfigHelper(authServerUrl())
        .simplePasswordConfig('MYDOMAIN', 'MYNAME', '>>>Super!Secret<<<', fakeRegion)
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

test('Client: no ak/sk opts', () => {
    const cfg = { auth: { auth_url: 'http://notempty' } }
    const client = new Client(cfg)
    expect(() => client.authAkSk()).toThrowError()
})

test('Client: ak/sk opts', async () => {
    const cfg = new CloudConfigHelper('http://nsdfdf').simpleAkSkConfig(
        randomString(10),
        randomString(20),
    )
    const client = new Client(cfg)
    client.authAkSk = jest.fn()
    await client.authenticate().catch(() => {
        console.log('This is fine')
    })
    expect(client.authAkSk).toBeCalled()
})
