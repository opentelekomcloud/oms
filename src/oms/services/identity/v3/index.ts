import { AuthOptions } from '../../../core'
import Service from '../../base'
import { CatalogEntity, createToken, ResponseToken, verifyToken } from './tokens'
import { createCredential, Credential } from './credentials'
import { ListOpts as ProjectListOpts, listProjects, Project } from './projects'
import HttpClient from '../../../core/http'
import { listCatalog } from './catalog'

export * from './tokens'
export * from './endpoints'
export * from './credentials'
export * from './services'

export class IdentityV3 extends Service {
    static readonly type = 'identity'

    constructor(url: string, httpClient: HttpClient) {
        if (url.endsWith('/v3')) {
            url = url.slice(0, -3)
        }
        super(url, httpClient)
    }

    /**
     * Get permanent auth token
     */
    async issueToken(credentials: AuthOptions, noCatalog?: boolean): Promise<ResponseToken> {
        return await createToken(this.client, credentials, noCatalog)
    }

    /**
     * Get existing token information
     */
    async verifyToken(tokenID: string, noCatalog?: boolean): Promise<ResponseToken> {
        return await verifyToken(this.client, tokenID, noCatalog)
    }

    /**
     * Create permanent AK/SK
     * @param userID
     * @param description
     */
    async getAKSK(userID: string, description?: string): Promise<Credential> {
        return await createCredential(this.client, userID, description)
    }

    /**
     * List available projects (tenants)
     */
    async listProjects(opts?: ProjectListOpts): Promise<Project[]> {
        return await listProjects(this.client, opts)
    }

    /**
     * List available service endpoints
     */
    async listCatalog(): Promise<CatalogEntity[]> {
        return await listCatalog(this.client)
    }

}
