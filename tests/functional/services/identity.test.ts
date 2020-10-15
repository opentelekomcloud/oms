import { cloudConfig } from '../../../src/oms/core'
import { Client } from '../../../src/oms'
import { IdentityV3 } from '../../../src/oms/services/identity/v3'

const authUrl = 'https://iam.eu-de.otc.t-systems.com/v3'
const t = process.env.OS_TOKEN
if (!t) {
    throw 'Missing OS_TOKEN required for tests'
}
const config = cloudConfig(authUrl).withToken(t).config
const client = new Client(config)


test('Projects: list', async () => {
    await client.authenticate()
    const iam = client.getService(IdentityV3)
    const projects = await iam.listProjects()
    expect(projects.length > 0).toBeTruthy()
})
