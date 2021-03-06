import HttpClient, { mergeHeaders, RequestOpts } from '../../src/oms/core/http'
import { Client, cloud } from '../../src/oms'

import fetchMock from 'jest-fetch-mock'
import { json } from '../utils/helpers'

test('RequestOpts: nothing', () => {
    expect(() => new RequestOpts({})).toThrowError(/^Request without Method.+/)
})

test('RequestOpts: no URL', () => {
    expect(() => new RequestOpts({ method: 'GET' })).toThrowError(/^Request without URL.+/)
})

test('RequestOpts: minimal OK', () => {
    expect(new RequestOpts({ method: 'GET', url: 'http://asdasd' }))
})

test('HTTP client: child', () => {
    const client = new HttpClient()
    client.child()
})


test('Client: non-string headers', () => {
    const headers = mergeHeaders({
        h1: true,
        h2: 64,
        h3: undefined,
    })
    expect(headers.get('h1')).toBe('true')
    expect(headers.get('h2')).toBe('64')
    expect(headers.has('h3')).toBeFalsy()
})

test('Client: header merging', () => {
    const merged = mergeHeaders(
        {
            h1: '1',
            h2: 2,
        },
        {
            h1: 3,
            h3: 'h3',
        })
    expect(merged.get('h1')).toBe('1, 3')
    expect(merged.get('h2')).toBe('2')
    expect(merged.get('h3')).toBe('h3')
})

const simpleBody = '{"token": {"user": {"domain": {"id": ""}}, "catalog": []}}'

describe('Test requests', () => {
    beforeAll(() => {
        fetchMock.enableMocks()
    })
    beforeEach(() => {
        fetchMock.resetMocks()
    })
    afterAll(() => {
        fetchMock.disableMocks()
    })


    test('Client: required headers', async () => {
        const authUrl = 'https://acme.com/'
        const config = cloud(authUrl).withToken('t').config
        const client = new Client(config)
        fetchMock.mockOnce(async r => {
            expect(r.headers.get('Accept')).toBeDefined()
            expect(r.headers.get('Content-Type')).toBeDefined()
            expect(r.headers.get('Host')).toBeDefined()
            expect(r.headers.get('User-Agent')).toBeDefined()
            return json(simpleBody)
        })
        await client.authenticate()
    })

    test('Client: complex URL', async () => {
        const authUrl = 'https://rtest.outcatcher.com/meta/proxy/https:/iam.eu-de.otc.t-systems.com/v3'
        const config = cloud(authUrl).withToken('t').config
        const client = new Client(config)
        fetchMock.mockOnce(async r => {
            expect(r.url).toBe(authUrl + '/auth/tokens')
            return json(simpleBody)
        })
        await client.authenticate()
    })
})

