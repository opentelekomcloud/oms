import HttpClient from '../../../core/http'

const url = '/v3/auth/projects'

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

export async function listProjects(client: HttpClient): Promise<Project[]> {
    const resp = await client.get<{ projects: Project[] }>({ url: url })
    return resp.data.projects
}
