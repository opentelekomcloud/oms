import {AuthOptions, NameOrID, Service} from "../core/types";
import {AxiosInstance} from "axios";

class authRequestData {
    auth!: {
        identity: {
            methods: ["password"]
            password: {
                user: {
                    id?: string
                    name?: string
                    password: string
                    domain: NameOrID
                }
            }
        }
        scope?: {
            project?: NameOrID
            domain?: NameOrID
        }
    }

    constructor(credentials: AuthOptions) {
        this.auth.identity.password.user.name = credentials.username
        if (!credentials.password) {
            throw 'Password has to be provided'
        }
        this.auth.identity.password.user = {
            name: credentials.username,
            password: credentials.password,
            domain: {
                id: credentials.domain_id,
                name: credentials.domain_name
            }
        }
        if (credentials.project_name || credentials.project_id) {
            this.auth.scope = {
                project: {
                    id: credentials.project_id,
                    name: credentials.project_name,
                }
            }
        } else {
            this.auth.scope = {
                domain: {
                    id: credentials.domain_id,
                    name: credentials.domain_name,
                }
            }
        }
    }
}


class Token {
    token!: {
        user: object
        issued_at: string
        expires_at: string
        projects: object[]
        methods: string[]
        catalog: object[]
        roles: { id: string, name: string }[]
    }
}

export class Keystone extends Service {
    static type = 'identity'
    static version = '3'

    constructor(url: string, client: AxiosInstance) {
        super(Keystone.type, Keystone.version, url, client)
    }

    /**
     * getToken make a POST to /auth/tokens returning token ID and saving response data
     * to the `Keystone` instance
     * @param credentials
     */
    async getToken(credentials: AuthOptions): Promise<string> {
        const data = new authRequestData(credentials)
        let resp = await this.httpClient!.post<Token>('/auth/tokens/', data)
        return resp.headers['X-Subject-Token']
    }

}
