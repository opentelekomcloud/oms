/// <reference types="jest" />
/**
 * @jest-environment node
 */
import { Client } from '../../src/oms'
import { CloudConfigHelper } from '../../src/oms/core'
import { IdentityV3 } from '../../src/oms/services/identity/v3'
import { ImageV2 } from '../../src/oms/services/image'
import Service from '../../src/oms/services/base'
import HttpClient from '../../src/oms/core/http'


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
    const iam = client.getService(IdentityV3)
    expect(iam.client.baseConfig.baseURL).toContain('iam.')
    const ims = client.getService(ImageV2)
    expect(ims.client.baseConfig.baseURL).toContain('ims.')
})

class PseudoIam extends Service {
    static readonly type = 'thisisnotaserviceyourelookingfor'

    constructor(url: string, client: HttpClient) {
        super(url, client)
    }
}


test('Client_invalidService', async () => {
    const client = new Client(config!)
    await client.authenticate()
    expect(() => client.getService(PseudoIam)).toThrow(`Service '${PseudoIam.type}' is not registered`)
})
