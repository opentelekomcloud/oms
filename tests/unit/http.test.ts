import HttpClient, { mergeHeaders, RequestOpts } from '../../src/oms/core/http'
import { cloudConfig } from '../../src/oms/core'
import { Client } from '../../src/oms'

import { disableFetchMocks, enableFetchMocks } from 'jest-fetch-mock'

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

test('Client: required headers', async () => {
    const authUrl = 'https://google.com/'
    const config = cloudConfig(authUrl).withToken('t').config
    const client = new Client(config)
    enableFetchMocks()
    fetchMock.mockOnce(async r => {
        expect(r.headers.get('Accept')).toBeDefined()
        expect(r.headers.get('Content-Type')).toBeDefined()
        expect(r.headers.get('Host')).toBeDefined()
        expect(r.headers.get('User-Agent')).toBeDefined()
        return '{"token": {"user": {"domain": {"id": ""}}, "catalog": []}}'
    })
    await client.authenticate()
    disableFetchMocks()
})
