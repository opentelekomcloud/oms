/// <reference types="jest" />
/**
 * @jest-environment node
 */
import Client from '../../src/oms/client'
import {CloudConfig, CloudConfigHelper} from "../../src/oms/core/types";
import IdentityV3 from "../../src/oms/services/identity";
import ImageV2 from "../../src/oms/services/image";


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
    expect(Array.from(client._services.keys())).toHaveLength(Object.keys(client.services).length)
    const iam = client.getService(IdentityV3)
    expect(iam.client.baseConfig.baseURL).toContain('iam.')
    const ims = client.getService(ImageV2)
    expect(ims.client.baseConfig.baseURL).toContain('ims.')
})

test("Client_invalidService", async () => {
    const client = new Client(config!)
    client.services.push('identiti/v3')
    await client.authenticate()
    expect(Array.from(client._services.keys())).toHaveLength(client.services.length - 1)
})

test("Client_invalidVersion", async () => {
    const client = new Client(config!)
    client.services.push('identity/v1')
    await client.authenticate()
    expect(Array.from(client._services.keys())).toHaveLength(client.services.length)
})
