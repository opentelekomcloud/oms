import Client from '../../../src/oms'
import { cloudConfig } from '../../../src/oms/core'
import { ImageV2 } from '../../../src/oms/services/image'

const authUrl = 'https://iam.eu-de.otc.t-systems.com/v3'
const t = process.env.OS_TOKEN
if (!t) {
    throw 'Missing OS_TOKEN required for tests'
}
const defaultConfig = cloudConfig(authUrl).withToken(t)
const defaultClient = new Client(defaultConfig)

jest.setTimeout(1000000)  // for debug

beforeAll(async () => {
    await defaultClient.authenticate()
})

test('List Images: basic', async () => {
    await defaultClient.authenticate()
    const ims = defaultClient.getService(ImageV2)
    ims.listImages()
})

test('List Images: first page', async () => {
    await defaultClient.authenticate()
    const ims = defaultClient.getService(ImageV2)
    const pager = ims.listImages({})
    const result = await pager.next()
    expect(result.value).toBeDefined()
    expect(result.value?.images.length).toBe(25)
})

test('List Images: pagination', async () => {
    await defaultClient.authenticate()
    const ims = defaultClient.getService(ImageV2)
    const pager = ims.listImages({ created_at: { date: new Date(), operator: 'lt' } })
    for await (const page of pager) {
        expect(page.images.length <= 25).toBeTruthy()
        expect(page.images.length > 0).toBeTruthy()
        const image0 = page.images[0]
        expect(image0).toHaveProperty('id')
    }
})

test('List Images: all', async () => {
    await defaultClient.authenticate()
    const ims = defaultClient.getService(ImageV2)
    let totalCount = 0
    for await (const page of ims.listImages()) {
        totalCount += page.images.length
    }
    const allPages = await ims.listImages().all()
    expect(allPages.images.length).toBe(totalCount)
})
