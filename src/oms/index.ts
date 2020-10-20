import { CloudConfig } from './core'
import Service, { ServiceType } from './services/base'
import HttpClient from './core/http'
import isEmpty from 'lodash/isEmpty'
import { CatalogEntity, IdentityV3, ResponseToken } from './services/identity/v3'
import { getSignedUrl } from './core/signer'

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
        this.httpClient.beforeRequest.last = (config => {
            // const signingTool = new Signature()
            // const url = new URL(config.url)
            // const region = this.cloud.region
            // if (!region){
            //     throw Error('Missing Region')
            // }
            // if (!this.cloud.auth.ak || !this.cloud.auth.sk) {
            //     throw Error(`Missing AK/SK: ${JSON.stringify(this.cloud.auth)}`)
            // }
            // const authData: SignatureInputData = {
            //     method: config.method,
            //     url: url,
            //     headers: config.headers,
            //     accessKey: this.cloud.auth.ak,
            //     secretKey: this.cloud.auth.sk,
            //     region: '',
            //     service: '',
            // }
            // // add signing interceptor
            // const signature = signingTool.generateSignature(authData)
            // if (signature) {
            //     config.headers.set('Content-Type', signature['Content-Type'])
            //     config.headers.set('X-Amz-Date', signature['X-Sdk-Date'])
            //     config.headers.set('Authorization', signature.Authorization)
            // }
            if (!this.cloud.auth.ak || !this.cloud.auth.sk) {
                throw Error(`Missing AK/SK: ${JSON.stringify(this.cloud.auth)}`)
            }
            let newHeaders = {}
            const userAgent = config.headers.get('User-Agent')
            config.headers.append('Accept', 'application/json')
            if (userAgent){
                newHeaders = Object.assign({'user-agent': userAgent}, newHeaders)
            }
            const url = new URL(config.url)
            const signedUrl = getSignedUrl(
                {
                    accessKeyId: this.cloud.auth.ak,
                    secretAccessKey: this.cloud.auth.sk,
                    regionName: ''
                },
                {
                    method: config.method,
                    hostName: url.host,
                    serviceName: '',
                    uriPath: url.pathname,
                    headers: newHeaders
                });
            if (signedUrl) {
                config.headers.set('X-Amz-Date', signedUrl['X-Sdk-Date'])
                config.headers.set('Authorization', signedUrl.Authorization)
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
