import { Client, cloud, IdentityV3 } from '../../../src/oms'

const authUrl = 'https://iam.eu-de.otc.t-systems.com/v3'

test('Projects: list (token)', async () => {
    const t = process.env.OS_TOKEN
    if (!t) {
        throw 'Missing OS_TOKEN required for tests'
    }
    const config = cloud(authUrl).withToken(t).config
    const client = new Client(config)
    await client.authenticate()
    const iam = client.getService(IdentityV3)
    const projects = await iam.listProjects()
    expect(projects.length > 0).toBeTruthy()
})

test('Projects: list (ak sk)', async () => {
    const ak = process.env.AWS_ACCESS_KEY_ID
    if (!ak) {
        throw 'Missing AWS_ACCESS_KEY_ID required for tests'
    }
    const sk = process.env.AWS_SECRET_ACCESS_KEY
    if (!sk) {
        throw 'Missing AWS_SECRET_ACCESS_KEY required for tests'
    }
    const configAkSk = cloud(authUrl).withAKSK(ak, sk).config
    const clientAkSk = new Client(configAkSk)
    await clientAkSk.authenticate()
    const iam = clientAkSk.getService(IdentityV3)
    const projects = await iam.listProjects()
    expect(projects.length > 0).toBeTruthy()
})
