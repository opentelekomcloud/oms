import { CloudConfigHelper } from '../../src/oms/core/types';
import { authServerUrl, fakeAuthServer, fakeRegion, fakeServiceServer } from '../utils/servers'
import Client from '../../src/oms/client';

beforeAll(() => {
    fakeAuthServer.listen()
    fakeServiceServer.listen()
})

afterAll(() => {
    fakeAuthServer.close()
    fakeServiceServer.close()
})

test('Client_auth', async () => {
    const cfg = new CloudConfigHelper(authServerUrl())
        .simplePasswordConfig('MYDOMAIN', 'MYNAME', '>>>Super!Secret<<<', fakeRegion)
    const client = new Client(cfg)
    await client.authenticate()
    await client.loadServiceCatalog()
})
