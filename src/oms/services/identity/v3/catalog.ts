/**
 * Support auth catalog operations
 */
import HttpClient from '../../../core/http'
import { CatalogEntity } from './tokens'


const listURL = '/v3/auth/catalog'


export async function listCatalog(client: HttpClient): Promise<CatalogEntity[]> {
    const resp = await client.get<{ catalog: CatalogEntity[] }>({ url: listURL })
    return resp.data.catalog
}
