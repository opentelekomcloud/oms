import HttpClient, { QueryParams } from '../../../core/http'

const url = '/v3/projects'

export interface ListOpts extends QueryParams{
    readonly domain_id?: string
    readonly name?: string
    readonly parent_id?: string
    readonly enabled?: boolean
    readonly is_domain?: boolean
}

export interface Project {
    readonly id: string
    readonly enabled: boolean
    readonly domain_id: string
    readonly is_domain: boolean
    readonly parent_id: string
    readonly name: string
    readonly description: string
    readonly links: {
        readonly next: string | null
        readonly previous: string | null
        readonly self: string
    }
}

export async function listProjects(client: HttpClient, opts?: ListOpts): Promise<Project[]> {
    const resp = await client.get<{ projects: Project[] }>({ url: url, params: opts })
    return resp.data.projects
}
