import HttpClient from '../../../core/http'

const listURL = '/v3/services'

export interface ServiceRef {
    name: string
    type: string
    links: {
        next?: string
        previous?: string
        self: string
    }
    id: string
    enabled: boolean
}

export async function listServices(client: HttpClient): Promise<ServiceRef[]> {
    const resp = await client
        .get<{ services: ServiceRef[] }>({ url: listURL })
    return resp.data.services
}
