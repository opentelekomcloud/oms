import { Client, cloud } from '../../src/oms'

const authUrl = 'https://iam.eu-de.otc.t-systems.com'
const ak = process.env.AWS_ACCESS_KEY_ID
if (!ak) {
    throw 'Missing AWS_ACCESS_KEY_ID required for tests'
}
const sk = process.env.AWS_SECRET_ACCESS_KEY
if (!sk) {
    throw 'Missing AWS_SECRET_ACCESS_KEY required for tests'
}

test('Client: ak/sk auth', async () => {
    const configAkSk = cloud(authUrl)
        .withAKSK(ak, sk)
        .withProject('eu-de')
        .config
    const clientAkSk = new Client(configAkSk)
    await clientAkSk.authenticate()
    expect(clientAkSk.projectID).toBeTruthy()
    expect(clientAkSk.domainID).toBeTruthy()
})
