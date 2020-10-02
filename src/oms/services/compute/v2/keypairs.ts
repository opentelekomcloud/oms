import HttpClient from '../../../core/http'

const listURL = '/os-keypairs'

export interface KeyPair {
    readonly fingerprint: string
    readonly name: string
    readonly type?: string
    readonly public_key: string
}

export async function listKeyPairs(client: HttpClient): Promise<KeyPair[]> {
    const resp = await client.get<{ keypairs: { keypair: KeyPair }[] }>({ url: listURL })
    return resp.data.keypairs.map(k => k.keypair)
}
