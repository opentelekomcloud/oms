import HttpClient from '../../../core/http'

const listURL = '/v3/endpoints'

export interface Endpoint {
    id: string
    service_id: string
    region?: string
    links: unknown
    interface: string
    url: string
}

export async function listEndpoints(client: HttpClient): Promise<Endpoint[]> {
    const resp = await client.get<{ endpoints: Endpoint[] }>({ url: listURL })
    return resp.data.endpoints
}
