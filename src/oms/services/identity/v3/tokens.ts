import { AuthOptions, NameOrID } from '../../../core/types'
import HttpClient from '../../../core/http'

const url = '/v3/auth/tokens'

interface domain {
    id: string
    name: string
}

interface authRecord {
    id: string
    name: string
    domain: domain
}

interface tokenInfo {
    user: authRecord
    project?: authRecord
    catalog?: {
        type: string,
        id: string,
        name: string,
        endpoints: {
            url: string
            region: string
            region_id: string
            interface: string
            id: string
        }[]
    }[]
}

export interface Token extends tokenInfo {
    id: string
}

interface identity {
    password: {
        user: {
            id?: string
            name?: string
            password: string
            domain: NameOrID
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
export async function createToken(client: HttpClient, authOptions: AuthOptions, nocatalog?: boolean): Promise<Token> {
    const params = nocatalog ? { nocatalog: 'nocatalog' } : undefined
    const data = optsToRequestData(authOptions)
    const resp = await client
        .post<tokenInfo>({ url: url, json: data, params: params })
        .catch(e => {
            console.log(JSON.stringify(e))
            throw e
        })
    const token = resp.data
    const tokenID = resp.headers.get('X-Subject-Token')
    if (!tokenID) {
        throw 'No token provided as X-Subject-Token'
    }
    return { id: tokenID, ...token }
}

/**
 * Verifying a Token
 * @param client
 * @param token - token to be verified
 * @param nocatalog - not attach catalog to token
 */
export async function verifyToken(client: HttpClient, token: string, nocatalog?: boolean): Promise<Token> {
    const params = nocatalog ? { nocatalog: 'nocatalog' } : undefined
    // eslint-disable-next-line @typescript-eslint/naming-convention
    const resp = await client.get<Token>({ url: url, headers: { 'X-Subject-Token': token }, params: params })
    return resp.data
}
