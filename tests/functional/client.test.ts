/// <reference types="jest" />
/**
 * @jest-environment node
 */
import { Client, IdentityV3, ImageV2 } from '../../src/oms'
import Service from '../../src/oms/services/base'
import HttpClient from '../../src/oms/core/http'
import { authCases, commonBeforeAll } from './helpers'

jest.setTimeout(1000000)

describe.each(authCases)(
    '%s client',
    authType => {

        let client: Client

        beforeAll(async () => {
            client = await commonBeforeAll(authType)
        })


        test('Client_auth', async () => {
            await client.authenticate()
            // expect(client.domainID).toBeTruthy()
            expect(client.projectID).toBeTruthy()
        })

        test('Client_serviceCatalog', async () => {
            await client.authenticate()
            const iam = client.getService(IdentityV3)
            expect(iam.client.baseConfig.baseURL).toContain('iam.')
            const ims = client.getService(ImageV2)
            expect(ims.client.baseConfig.baseURL).toContain('ims.')
        })

        class PseudoIam extends Service {
            static readonly type = 'thisisnotaserviceyourelookingfor'

            constructor(url: string, client: HttpClient) {
                super(url, client)
            }
        }


        test('Client_invalidService', async () => {
            await client.authenticate()
            expect(() => client.getService(PseudoIam)).toThrow(`Service '${PseudoIam.type}' is not registered`)
        })

    },
)
