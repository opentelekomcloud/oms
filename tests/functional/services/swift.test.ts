import { Client, SwiftV1 } from '../../../src/oms'
import { randomString } from '../../utils/helpers'
import { authCases, commonBeforeAll } from '../helpers'

jest.setTimeout(30000)  // for debug

describe.each(authCases)(
    '%s client',
    authType => {
        const onlyToken = authType !== 'token' ? test.skip : test

        let client: Client

        beforeAll(async () => {
            client = await commonBeforeAll(authType)
        })

        test('AccountMetadata: show metadata', async () => {
            const srv = client.getService(SwiftV1)
            const account = await srv.showAccountMetadata()
            expect(account).toBeDefined()
            expect(account.domainID).toBe(client.domainID)
        })

        onlyToken('Account: update metadata', async () => {
            const srv = client.getService(SwiftV1)
            const testMeta = {
                meta: 'data',
                meta2: 'atad',
            }
            await srv.updateAccountMetadata(testMeta)
            const account = await srv.showAccountMetadata()
            expect(account.metadata).toHaveProperty('meta')
            expect(account.metadata).toHaveProperty('meta2')
            expect(account.metadata.meta).toBe(testMeta.meta)
            expect(account.metadata.meta2).toBe(testMeta.meta2)
        })

        // needs a user with enough rights
        test.skip('AccountMetadata: update quota', async () => {
            const srv = client.getService(SwiftV1)
            const testQuota = 20
            await srv.updateAccountMetadata(undefined, testQuota)
            const account = await srv.showAccountMetadata()
            expect(account.metadata['quota-bytes']).toBe(testQuota)
        })

        test('Containers: list', async () => {
            const srv = client.getService(SwiftV1)
            const containers = await srv.listContainers()
            expect(containers).toBeDefined()
            expect(containers).toHaveProperty('length')
        })

        onlyToken('Containers: workflow', async () => {
            const srv = client.getService(SwiftV1)
            const name = randomString(10)
            await srv.createContainer(name, undefined, { 'container-meta': 'yes' })
            let containers = await srv.listContainers()
            const found = () => containers.find(c => c.name === name)
            expect(found()).toBeDefined()

            const meta = await srv.showContainerMetadata(name)
            const whole = await srv.getContainer(name)
            for (const o of [meta, whole]) {
                expect(o).toBeDefined()
                expect(o).toHaveProperty('name')
                expect(o).toHaveProperty('bytes')
                expect(o).toHaveProperty('created')
                expect(o.metadata).toBeDefined()
                expect(o.metadata).toHaveProperty('container-meta')
                expect(o.metadata?.['container-meta']).toBe('yes')
                expect(o.count).toBe(0)
            }

            await srv.deleteContainer(name)
            containers = await srv.listContainers()
            expect(found()).not.toBeDefined()

            await expect(() => srv.showContainerMetadata(name)).rejects.toThrowError()
        })

    },
)
