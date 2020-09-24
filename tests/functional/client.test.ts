/// <reference types="jest" />
/**
 * @jest-environment node
 */
import Client from '../../src/oms/client'
import {CloudConfig, CloudConfigHelper} from "../../src/oms/core/types";


let config: CloudConfig | null = null
const authUrl = 'https://iam.eu-de.otc.t-systems.com'
jest.setTimeout(1000000)

beforeAll(() => {
    const t = process.env.OS_TOKEN
    if (!t) {
        throw 'Missing OS_TOKEN required for tests'
    }
    config = new CloudConfigHelper(authUrl).simpleTokenConfig(t)
})

test("Client_auth", async () => {
    const client = new Client(config!)
    await client.authenticate()
})

test("Client_serviceCatalog", async () => {
    const client = new Client(config!)
    await client.authenticate()
    expect(Array.from(client._services.keys())).toHaveLength(client.services.length)
    expect(client._services.get('identity/3')!.client.baseURL).toContain('iam.')
    expect(client._services.get('compute/2')!.client.baseURL).toContain('ecs.')
})

test("Client_invalidService", async () => {
    const client = new Client(config!)
    client.services.push({type: 'identiti', version: '3'})
    await client.authenticate()
    expect(Array.from(client._services.keys())).toHaveLength(client.services.length - 1)
})

test("Client_invalidVersion", async () => {
    const client = new Client(config!)
    client.services.push({type: 'identity', version: '1'})
    await client.authenticate()
    expect(Array.from(client._services.keys())).toHaveLength(client.services.length)
})
