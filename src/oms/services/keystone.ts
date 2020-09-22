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
        this.auth.identity.password.user.id = credentials.userID
        this.auth.identity.password.user.name = credentials.username
        if (!credentials.password) {
            throw 'Password has to be provided'
        }
        this.auth.identity.password.user.password = credentials.password
        this.auth.identity.password.user.domain.id = credentials.domainID
        this.auth.identity.password.user.domain.name = credentials.domainName
        if (credentials.projectName || credentials.projectID) {
            this.auth.scope = {
                project: {
                    id: credentials.projectID,
                    name: credentials.projectName,
                }
            }
        } else {
            this.auth.scope = {
                domain: {
                    id: credentials.domainID,
                    name: credentials.domainName,
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
    constructor(url: string, client: AxiosInstance) {
        super('keystone', 'identity', '3', url, client)
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
