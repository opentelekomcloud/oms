import { Client, cloudConfig, SwiftV1 } from '../../../src/oms'

const authUrl = 'https://iam.eu-de.otc.t-systems.com/v3'
const t = process.env.OS_TOKEN
if (!t) {
    throw 'Missing OS_TOKEN required for tests'
}
const config = cloudConfig(authUrl).withToken(t).config
const client = new Client(config)

beforeAll(async () => {
    await client.authenticate()
})

test('Containers: list', async () => {
    const srv = client.getService(SwiftV1)
    const cnts = await srv.listContainers()
    expect(cnts).toBeDefined()
})
