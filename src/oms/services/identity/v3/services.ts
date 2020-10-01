import HttpClient from '../../../core/http'

const listURL = '/v3/services'

export interface ServiceRef {
    readonly name: string
    readonly type: string
    readonly links: {
        readonly next?: string
        readonly previous?: string
        readonly self: string
    }
    readonly id: string
    readonly enabled: boolean
}

export async function listServices(client: HttpClient): Promise<ServiceRef[]> {
    const resp = await client
        .get<{ services: ServiceRef[] }>({ url: listURL })
    return resp.data.services
}
