import Client from '../../../src/oms/client';
import { CloudConfig, CloudConfigHelper } from '../../../src/oms/core/types';
import ImageV2 from '../../../src/oms/services/image';

let defaultConfig: CloudConfig
let defaultClient: Client

const authUrl = 'https://iam.eu-de.otc.t-systems.com/v3'

jest.setTimeout(1000000)  // for debug

beforeAll(() => {
    const t = process.env.OS_TOKEN
    if (!t) {
        throw 'Missing OS_TOKEN required for tests'
    }
    defaultConfig = new CloudConfigHelper(authUrl).simpleTokenConfig(t)
    defaultClient = new Client(defaultConfig)
})

test('List Images: basic', async () => {
    await defaultClient.authenticate()
    const ims = defaultClient!.getService(ImageV2)
    ims.listImages()
})

test('List Images: first page', async () => {
    await defaultClient.authenticate()
    const ims = defaultClient!.getService(ImageV2)
    const pager = ims.listImages({})
    const result = await pager.next()
    expect(result.value.images.length).toBe(25)
})

test('List Images: pagination', async () => {
    await defaultClient.authenticate()
    const ims = defaultClient!.getService(ImageV2)
    const pager = ims.listImages({ created_at: { date: new Date(), operator: 'lt' } })
    for await (const page of pager) {
        expect(page.images.length <= 25).toBeTruthy()
        expect(page.images.length > 0).toBeTruthy()
    }
})
