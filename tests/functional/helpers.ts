import { Client, cloud } from '../../src/oms'

export const authUrl = 'https://iam.eu-de.otc.t-systems.com/v3'

export const authCases = ['ak/sk', 'token']

export async function commonBeforeAll(authType: string): Promise<Client> {
    const config = cloud(authUrl)
    switch (authType) {
    case 'ak/sk':
        const ak = process.env.AWS_ACCESS_KEY_ID
        const sk = process.env.AWS_SECRET_ACCESS_KEY
        const projectName = process.env.OS_PROJECT_NAME
        if (!ak || !sk || !projectName) {
            throw 'Missing AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY and OS_PROJECT_NAME required for tests'
        }
        config.withAKSK(ak, sk).withProject(projectName)
        break
    case 'token':
        const t = process.env.OS_TOKEN
        if (!t) {
            throw 'Missing OS_TOKEN required for tests'
        }
        config.withToken(t)
        break
    }
    const client = new Client(config.config)
    await client.authenticate()
    return client
}
