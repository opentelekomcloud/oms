import { JSONSchema4, JSONSchema6, JSONSchema7 } from 'json-schema'

export interface NameOrID {
    readonly id?: string
    readonly name?: string
}

/**
 * Simple implementation of OpenStack auth options
 */
export class AuthOptions {
    auth_url!: string
    token?: string
    username?: string
    password?: string
    domain_name?: string
    domain_id?: string
    project_name?: string
    project_id?: string

    ak?: string
    sk?: string
}

/**
 * OpenTelekomCloud cloud configuration
 */
export class CloudConfig {
    auth: AuthOptions
    region?: string

    constructor() {
        this.auth = new (AuthOptions)()
    }
}

/**
 * CloudConfigHelper provides helper functions to get cloud configurations
 */
export class CloudConfigHelper {
    authUrl: string

    private readonly cfg: CloudConfig

    get config(): CloudConfig {
        return this.cfg
    }

    constructor(authUrl: string) {
        this.authUrl = authUrl
        this.cfg = this.baseCfg()
    }

    private baseCfg(): CloudConfig {
        const cc = new (CloudConfig)()
        cc.auth.auth_url = this.authUrl
        return cc
    }

    withRegion(region: string): CloudConfigHelper {
        this.config.region = region
        return this
    }

    withPassword(domainName: string, username: string, password: string, projectName: string): CloudConfigHelper {
        this.config.auth.domain_name = domainName
        this.config.auth.username = username
        this.config.auth.password = password
        this.config.auth.project_name = projectName
        return this
    }

    withToken(token: string): CloudConfigHelper {
        this.config.auth.token = token
        return this
    }

    withAKSK(ak: string, sk: string, projectName?: string): CloudConfigHelper {
        this.config.auth.ak = ak
        this.config.auth.sk = sk
        this.config.auth.project_name = projectName
        return this
    }
}

export function cloudConfig(authURL: string): CloudConfigHelper {
    return new CloudConfigHelper(authURL)
}

const msRe = /(?<=\d{2})\.\d{3}(?=Z)/

export function normalizeDateTime(date?: string | Date): string | undefined {
    if (!date) {
        return
    }
    return new Date(date)
        .toISOString()
        .replace(msRe, '')
}

export type JSONSchema = JSONSchema4 | JSONSchema6 | JSONSchema7

export interface Metadata {
    [key: string]: string
}
