import { Client, cloudConfig, SwiftV1 } from '../../../src/oms'
import { randomString } from '../../utils/helpers'

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

test('Account: show metadata', async () => {
    const srv = client.getService(SwiftV1)
    const account = await srv.showAccountMetadata()
    expect(account).toBeDefined()
    expect(account.domainID).toBe(client.domainID)
})

test('Containers: list', async () => {
    const srv = client.getService(SwiftV1)
    const containers = await srv.listContainers()
    expect(containers).toBeDefined()
    expect(containers).toHaveProperty('length')
})

test('Containers: workflow', async () => {
    const srv = client.getService(SwiftV1)
    const name = randomString(10)
    await srv.createContainer(name)
    let containers = await srv.listContainers()
    const found = () => containers.find(c => c.name === name)
    expect(found()).toBeDefined()
    await srv.deleteContainer(name)
    containers = await srv.listContainers()
    expect(found()).not.toBeDefined()
})
