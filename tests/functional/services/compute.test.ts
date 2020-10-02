import { CloudConfig, CloudConfigHelper } from '../../../src/oms/core/types'
import Client from '../../../src/oms'
import { ComputeV2 } from '../../../src/oms/services/compute'

let defaultConfig: CloudConfig
let defaultClient: Client

const authUrl = 'https://iam.eu-de.otc.t-systems.com/v3'

jest.setTimeout(1000000)  // for debug

beforeAll(async () => {
    const t = process.env.OS_TOKEN
    if (!t) {
        throw 'Missing OS_TOKEN required for tests'
    }
    defaultConfig = new CloudConfigHelper(authUrl).withToken(t)
    defaultClient = new Client(defaultConfig)
    await defaultClient.authenticate()
})

test('Nova: list key pairs', async () => {
    const nova = defaultClient.getService(ComputeV2)
    const keyPairs = await nova.listKeyPairs()
    expect(keyPairs.length).toBeTruthy()
    expect(keyPairs[0]).toHaveProperty('name')
    expect(keyPairs[0]).toHaveProperty('fingerprint')
    expect(keyPairs[0]).toHaveProperty('public_key')
})
