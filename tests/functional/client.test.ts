/// <reference types="jest" />
/**
 * @jest-environment node
 */
import Client from '../../src/oms'
import { CloudConfigHelper } from '../../src/oms/core/types'
import ImageV2 from '../../src/oms/services/image'
import { IdentityV3 } from '../../src/oms/services/identity/v3'


const authUrl = 'https://iam.eu-de.otc.t-systems.com'
const t = process.env.OS_TOKEN
if (!t) {
    throw 'Missing OS_TOKEN required for tests'
}
const config = new CloudConfigHelper(authUrl).withToken(t)
jest.setTimeout(1000000)

test('Client_auth', async () => {
    const client = new Client(config!)
    await client.authenticate()
})

test('Client_serviceCatalog', async () => {
    const client = new Client(config!)
    await client.authenticate()
    expect(Array.from(client.serviceMap.keys())).toHaveLength(Object.keys(client.services).length)
    const iam = client.getService(IdentityV3)
    expect(iam.client.baseConfig.baseURL).toContain('iam.')
    const ims = client.getService(ImageV2)
    expect(ims.client.baseConfig.baseURL).toContain('ims.')
})

test('Client_invalidService', async () => {
    const client = new Client(config!)
    client.services.push('identiti')
    await client.authenticate()
    expect(Array.from(client.serviceMap.keys())).toHaveLength(client.services.length - 1)
})
