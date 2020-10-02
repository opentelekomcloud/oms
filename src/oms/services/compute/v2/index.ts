import Service from '../../base'
import HttpClient from '../../../core/http'
import { KeyPair, listKeyPairs } from './keypairs'

/**
 * Compute v2 (Nova) service client
 */
export class ComputeV2 extends Service {
    static readonly type: string = 'compute'

    constructor(url: string, client: HttpClient) {
        super(url, client)
    }

    async listKeyPairs(): Promise<KeyPair[]> {
        return await listKeyPairs(this.client)
    }
}
