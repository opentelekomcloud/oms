import { Client, cloud, CloudConfig, ComputeV1, ComputeV2 } from '../../../src/oms'

let config: CloudConfig
let client: Client

const authUrl = 'https://iam.eu-de.otc.t-systems.com/v3'

jest.setTimeout(1000000)  // for debug

beforeAll(async () => {
    const t = process.env.OS_TOKEN
    if (!t) {
        throw 'Missing OS_TOKEN required for tests'
    }
    config = cloud(authUrl).withToken(t).config
    client = new Client(config)
    await client.authenticate()
})

test('Nova: list key pairs', async () => {
    const nova = client.getService(ComputeV2)
    const keyPairs = await nova.listKeyPairs()
    expect(keyPairs.length).toBeTruthy()
    expect(keyPairs[0]).toHaveProperty('name')
    expect(keyPairs[0]).toHaveProperty('fingerprint')
    expect(keyPairs[0]).toHaveProperty('public_key')
})

test('ECS: list flavors', async () => {
    const ecs = client.getService(ComputeV1)
    const all = await ecs.listFlavors()
    expect(all).toBeDefined()
    expect(all[0]).toHaveProperty('id')
    const az02flavs = await ecs.listFlavors('eu-de-02')
    expect(az02flavs).toBeDefined()
    expect(az02flavs[0]).toHaveProperty('id')
    expect(az02flavs.length < all.length).toBeTruthy()
})
