import { Client, ComputeV1, ComputeV2 } from '../../../src/oms'
import { authCases, commonBeforeAll } from '../helpers'

jest.setTimeout(1000000)  // for debug

describe.each(authCases)(
    '%s client',
    authType => {

        let client: Client

        beforeAll(async () => {
            client = await commonBeforeAll(authType)
        })

        test('Nova: list key pairs', async () => {
            const nova = client.getService(ComputeV2)
            const keyPairs = await nova.listKeyPairs()
            expect(keyPairs.length).toBeTruthy()
            expect(keyPairs[0]).toHaveProperty('name')
            expect(keyPairs[0]).toHaveProperty('fingerprint')
            expect(keyPairs[0]).toHaveProperty('public_key')
        })

        test('ECS: list flavors', async () => {
            const ecs = client.getService(ComputeV1)
            const all = await ecs.listFlavors()
            expect(all).toBeDefined()
            expect(all[0]).toHaveProperty('id')
            const az02flavs = await ecs.listFlavors('eu-de-01')
            expect(az02flavs).toBeDefined()
            expect(az02flavs[0]).toHaveProperty('id')
            expect(az02flavs.length < all.length).toBeTruthy()
        })

        test('ECS: list flavors in swiss region', async () => {
            const ecs = client.getService(ComputeV1)
            const all = await ecs.listFlavors()
            expect(all).toBeDefined()
            expect(all[0]).toHaveProperty('id')
            const az02flavs = await ecs.listFlavors('eu-ch2b')
            expect(az02flavs).toBeDefined()
            expect(az02flavs[0]).toHaveProperty('id')
            expect(az02flavs.length = all.length).toBeTruthy()
        })
    },
)
