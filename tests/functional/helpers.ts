import { Client, cloud, defaultRegion } from '../../src/oms'

export let authUrl = 'https://iam.eu-de.otc.t-systems.com/v3'

export const authCases = ['ak/sk', 'token', 'cloud']

export async function commonBeforeAll(authType: string): Promise<Client> {
    let region = defaultRegion
    if (process.env.OS_REGION) {
        region = String(process.env.OS_REGION)
    }
    authUrl = 'https://iam.' + region + '.otc.t-systems.com/v3'
    if (region === 'eu-ch2'){
        authUrl = 'https://iam-pub.' + region + '.sc.otc.t-systems.com/v3'
    }
    const projectName = process.env.OS_PROJECT_NAME
    const config = cloud(authUrl)
    switch (authType) {
    case 'ak/sk':
        const ak = process.env.AWS_ACCESS_KEY_ID
        const sk = process.env.AWS_SECRET_ACCESS_KEY
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
    case 'cloud':
        const domainName = process.env.OS_DOMAIN_NAME
        const password = process.env.OS_PASSWORD
        const username = process.env.OS_USERNAME
        if (!username || !password || !domainName || !projectName) {
            throw 'Missing OS_DOMAIN_NAME, OS_PASSWORD, OS_USERNAME and OS_PROJECT_NAME required for tests'
        }
        config
            .withRegion(region)
            .withProject(projectName)
            .withPassword(domainName, username, password)
        break
    }

    const client = new Client(config.config)
    await client.authenticate()
    return client
}
