import { CloudConfig, getSignHeaders, RequestOpts } from './core'
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

    akskAuthHeader = 'Authorization'

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

    private injectCommonHeaders() {
        this.httpClient.beforeRequest.first = addCommonHeaders
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
        this.injectCommonHeaders()
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

    getService<S extends Service>(type: ServiceType<S>): S {
        const serviceURL = this.serviceMap.get(type.type)
        if (!serviceURL) {
            throw Error(`Service '${type.type}' is not registered`)
        }
        const srv = new type(serviceURL, this.httpClient)
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
            if (!this.cloud.auth.ak || !this.cloud.auth.sk) {
                throw Error(`Missing AK/SK: ${JSON.stringify(this.cloud.auth)}`)
            }
            if (this.projectID !== '') {
                config.headers.set('X-Project-Id', this.projectID)
            }
            if (this.domainID !== '') {
                config.headers.set('X-Domain-Id', this.domainID)
            }
            const url = new URL(config.url)
            const signedHeaders = getSignHeaders(
                {
                    accessKeyId: this.cloud.auth.ak,
                    secretAccessKey: this.cloud.auth.sk,
                    regionName: '',
                },
                {
                    method: config.method,
                    url: url,
                    serviceName: '',
                    headers: config.headers,
                })
            if (signedHeaders) {
                config.headers.set('X-Sdk-Date', signedHeaders['X-Sdk-Date'])
                config.headers.set(this.akskAuthHeader, signedHeaders.Authorization)
            }
            return config
        })
        const projectName = this.cloud.auth.project_name
        if (!this.projectID && projectName) {
            const iam = this.getIdentity()
            const proj = await iam.listProjects({ name: projectName })
            if (!proj.length) {
                throw Error(`Project with name ${projectName} doesn't exist`)
            }
            this.projectID = proj[0].id
            this.domainID = proj[0].domain_id
        }
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
        this.injectAuthToken()
        const identity = this.getIdentity()
        let token: ResponseToken
        if (!this.tokenID) {
            token = await identity.issueToken(this.cloud.auth)
            this.tokenID = token.id
        } else {
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

const appJSON = 'application/json'
const userAgent = 'OpenTelekomCloud JS/v1.0'

function addCommonHeaders(cfg: RequestOpts): RequestOpts {
    cfg.headers.append('User-Agent', userAgent)
    cfg.headers.append('Accept', appJSON)
    cfg.headers.append('Content-Type', appJSON)
    const base = cfg.baseURL || cfg.url || ''
    if (base) {
        cfg.headers.append('Host', new URL(base).host)
    }
    return cfg
}
