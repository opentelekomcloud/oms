import { AuthOptions, NameOrID } from '../../../core'
import HttpClient from '../../../core/http'

const url = '/v3/auth/tokens'

interface domain {
    readonly id: string
    readonly name: string
}

interface authRecord {
    id: string
    name: string
    domain: domain
}

export interface CatalogEntity {
    readonly type: string,
    readonly id: string,
    readonly name: string,
    readonly endpoints: {
        readonly url: string
        readonly region: string
        readonly region_id: string
        readonly interface: string
        readonly id: string
    }[]
}

interface ResponseTokenInfo {
    readonly user: authRecord
    readonly project?: authRecord
    readonly catalog?: CatalogEntity[]
}

export interface ResponseToken extends ResponseTokenInfo {
    readonly id: string
}

interface identity {
    readonly password: {
        readonly user: {
            readonly id?: string
            readonly name?: string
            readonly password: string
            readonly domain: NameOrID
        }
    }
}

interface AuthRequestData {
    [key: string]: unknown

    auth: {
        identity: identity
        scope?: {
            project?: NameOrID
            domain?: NameOrID
        }
    }
}

function optsToRequestData(opts: AuthOptions): AuthRequestData {
    if (!opts.password) {
        throw 'Password has to be provided'
    }
    const auth = {
        identity: {
            methods: ['password'],
            password: {
                user: {
                    name: opts.username,
                    password: opts.password,
                    domain: {
                        name: opts.domain_name,
                        id: opts.domain_id,
                    },
                },
            },
        },
        scope: {},
    }
    if (opts.project_name || opts.project_id) {
        auth.scope = {
            project: {
                id: opts.project_id,
                name: opts.project_name,
            },
        }
    } else {
        auth.scope = {
            domain: {
                id: opts.domain_id,
                name: opts.domain_name,
            },
        }
    }
    return { auth: auth }
}

/**
 * Get permanent auth token
 * @param client - HTTP client to use
 * @param authOptions
 * @param nocatalog - not attach catalog to token
 */
export async function createToken(client: HttpClient, authOptions: AuthOptions, nocatalog?: boolean): Promise<ResponseToken> {
    const params = nocatalog ? { nocatalog: 'nocatalog' } : undefined
    const data = optsToRequestData(authOptions)
    const resp = await client
        .post<{ token: ResponseTokenInfo }>({ url: url, json: data, params: params })
        .catch(e => {
            console.log(JSON.stringify(e))
            throw e
        })
    const token = resp.data.token
    const tokenID = resp.headers.get('X-Subject-Token')
    if (!tokenID) {
        throw 'No tokenID provided as X-Subject-Token'
    }
    return { id: tokenID, ...token }
}

/**
 * Verifying a Token
 * @param client
 * @param token - tokenID to be verified
 * @param nocatalog - not attach catalog to token
 */
export async function verifyToken(client: HttpClient, token: string, nocatalog?: boolean): Promise<ResponseToken> {
    const params = nocatalog ? { nocatalog: 'nocatalog' } : undefined
    const resp = await client.get<{ token: ResponseTokenInfo }>({
        url: url,
        // eslint-disable-next-line @typescript-eslint/naming-convention
        headers: { 'X-Subject-Token': token },
        params: params,
    })
    return { id: token, ...resp.data.token }
}
