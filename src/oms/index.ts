import { CloudConfig, Signature, SignatureInputData } from './core'
import Service, { ServiceType } from './services/base'
import HttpClient from './core/http'
import isEmpty from 'lodash/isEmpty'
import { CatalogEntity, IdentityV3, ResponseToken } from './services/identity/v3'

export * from './core'
export * from './services'

const defaultRegion = 'eu-de'

/**
 * Client is base provider client
 */
export class Client {
    /**
     * client provides unauthorized access to public resources
     */
    httpClient: HttpClient
    cloud: CloudConfig

    set tokenID(v: string) {
        this.cloud.auth.token = v
    }

    get tokenID(): string {
        return this.cloud.auth.token || ''
    }

    get projectID(): string {
        return this.cloud.auth.project_id || ''
    }

    set projectID(id: string) {
        this.cloud.auth.project_id = id
    }

    get domainID(): string {
        return this.cloud.auth.domain_id || ''
    }

    set domainID(id: string) {
        this.cloud.auth.domain_id = id
    }

    constructor(cloud: CloudConfig) {
        this.cloud = cloud
        if (!cloud.region) {
            cloud.region = defaultRegion
            if (cloud.auth.project_name) {
                cloud.region = cloud.auth.project_name.split('_', 1)[0]
            }
        }
        this.httpClient = new HttpClient({})
        this.injectAuthToken()
        // register identity service
        this.registerService(
            'identity',
            this.cloud.auth.auth_url,
        )
    }

    serviceMap: Map<string, string> = new Map<string, string>()

    registerService(type: string, url: string): void {
        this.serviceMap.set(type, url)
    }

    getService<S extends Service>(Type: ServiceType<S>): S {
        const serviceURL = this.serviceMap.get(Type.type)
        if (!serviceURL) {
            throw Error(`Service '${Type.type}' is not registered`)
        }
        const srv = new Type(serviceURL, this.httpClient)
        srv.projectID = this.projectID
        return srv
    }

    private getIdentity(): IdentityV3 {
        return this.getService(IdentityV3)
    }

    /**
     * Load service endpoint catalog for the region
     */
    saveServiceCatalog(catalog: CatalogEntity[]): void {
        catalog.forEach(ce => {
            const ep = ce.endpoints.find(e =>
                (e.region === this.cloud.region || e.region === '*') &&
                e.interface === 'public',
            )
            if (ep) {
                this.registerService(ce.type, ep.url)
            }
        })
    }

    /**
     * Authenticate with AK/SK
     */
    async authAkSk(): Promise<void> {
        const signingTool = new Signature()
        const url = new URL(this.cloud.auth.auth_url)
        const headers = new Headers();
        let region = this.cloud.region
        if (!region){
            region = defaultRegion
        }
        if (!this.cloud.auth.ak || !this.cloud.auth.sk) {
            throw Error(`Missing AK/SK: ${JSON.stringify(this.cloud.auth)}`)
        }
        headers.append( 'content-type', 'application/json')

        const authData: SignatureInputData = {
            method: 'POST',
            url: url,
            headers: headers,
            accessKey: this.cloud.auth.ak,
            secretKey: this.cloud.auth.sk,
            region: region,
            service: 'aksk',
        }
        // add signing interceptor
        const signature = signingTool.generateSignature(authData)
        type signature = typeof signature;
        this.httpClient.beforeRequest.push(config => {
            if (signature) {
                config.headers.set('Content-Type', signature['Content-Type'])
                config.headers.set('X-Amz-Date', signature['X-Amz-Date'])
                config.headers.set('Authorization', signature.Authorization)
            }
            return config
        })
    }

    private injectAuthToken() {
        this.httpClient.beforeRequest.push(config => {
            if (this.tokenID) {
                config.headers.set('X-Auth-Token', this.tokenID)
            }
            return config
        })
    }

    /**
     * Authenticate with token
     */
    async authToken(): Promise<void> {
        const identity = this.getIdentity()
        let token: ResponseToken
        if (!this.tokenID) {
            token = await identity.issueToken(this.cloud.auth)
            this.tokenID = token.id
            this.injectAuthToken()
        } else {
            this.injectAuthToken()
            token = await identity.verifyToken(this.tokenID)
        }
        if (token.project) {
            this.projectID = token.project.id
        }
        this.domainID = token.user.domain.id
        if (!token.catalog) {
            throw Error('No service catalog provided')
        }
        this.saveServiceCatalog(token.catalog)
    }

    /**
     * Authenticate client and populate domainID and projectID
     */
    async authenticate(): Promise<void> {
        if (isEmpty(this.cloud.auth)) {
            throw new Error('Missing auth options')
        }
        if (this.cloud.auth.ak && this.cloud.auth.sk) {
            await this.authAkSk()
        } else {
            await this.authToken()
        }
    }
}
