import { Client, ImageV2 } from '../../../src/oms'
import { authCases, commonBeforeAll } from '../helpers'

jest.setTimeout(30000)

describe.each(authCases)(
    '%s client',
    authType => {

        let client: Client

        beforeAll(async () => {
            client = await commonBeforeAll(authType)
        })


        test('List Images: basic', async () => {
            await client.authenticate()
            const ims = client.getService(ImageV2)
            ims.listImages()
        })

        test('List Images: first page', async () => {
            await client.authenticate()
            const ims = client.getService(ImageV2)
            const pager = ims.listImages({})
            const result = await pager.next()
            expect(result.value).toBeDefined()
            expect(result.value?.images.length).toBe(25)
        })

        test('List Images: pagination', async () => {
            await client.authenticate()
            const ims = client.getService(ImageV2)
            const pager = ims.listImages({ created_at: { date: new Date(), operator: 'lt' } })
            for await (const page of pager) {
                expect(page.images.length <= 25).toBeTruthy()
                expect(page.images.length > 0).toBeTruthy()
                const image0 = page.images[0]
                expect(image0).toHaveProperty('id')
            }
        })

        test('List Images: all', async () => {
            await client.authenticate()
            const ims = client.getService(ImageV2)
            let totalCount = 0
            for await (const page of ims.listImages()) {
                totalCount += page.images.length
            }
            const allPages = await ims.listImages().all()
            expect(allPages.images.length).toBe(totalCount)
        })
    },
)

