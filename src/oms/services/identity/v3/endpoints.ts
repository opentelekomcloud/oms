import HttpClient from '../../../core/http'

const listURL = '/v3/endpoints'

export interface Endpoint {
    readonly id: string
    readonly service_id: string
    readonly region?: string
    readonly links: unknown
    readonly interface: string
    readonly url: string
}

export async function listEndpoints(client: HttpClient): Promise<Endpoint[]> {
    const resp = await client.get<{ endpoints: Endpoint[] }>({ url: listURL })
    return resp.data.endpoints
}
