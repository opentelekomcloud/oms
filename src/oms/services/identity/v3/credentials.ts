import HttpClient from '../../../core/http'

const url = '/v3.0/OS-CREDENTIAL/credentials'


export interface Credential {
    readonly user_id: string
    readonly description?: string
    readonly access?: string
    readonly secret?: string
    readonly status?: string
}

/**
 * Create permanent AK/SK
 */
export async function createCredential(client: HttpClient, userID: string, description?: string): Promise<Credential> {
    const data = { user_id: userID, description: description }
    const resp = await client.post<Credential>({ url: url, json: data })
    if (!resp.ok) {
        throw 'Failed to create AK/SK'
    }
    return resp.data
}
