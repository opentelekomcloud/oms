import { JSONSchema4, JSONSchema6, JSONSchema7 } from 'json-schema'

export interface NameOrID {
    readonly id?: string
    readonly name?: string
}

/**
 * Simple implementation of OpenStack auth options
 */
export interface AuthOptions {
    readonly auth_url: string
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
export interface CloudConfig {
    auth: AuthOptions
    region?: string
}

/**
 * CloudConfigHelper provides helper functions to get cloud configurations
 */
class CloudConfigHelper {
    readonly config: CloudConfig

    constructor(authUrl: string) {
        this.config = { auth: { auth_url: authUrl } }
    }

    withRegion(region: string): CloudConfigHelper {
        this.config.region = region
        return this
    }

    withProject(projectName: string): CloudConfigHelper {
        this.config.auth.project_name = projectName
        return this
    }

    withPassword(domainName: string, username: string, password: string): CloudConfigHelper {
        this.config.auth.domain_name = domainName
        this.config.auth.username = username
        this.config.auth.password = password
        return this
    }

    withToken(token: string): CloudConfigHelper {
        this.config.auth.token = token
        return this
    }

    withAKSK(ak: string, sk: string): CloudConfigHelper {
        this.config.auth.ak = ak
        this.config.auth.sk = sk
        return this
    }
}

/**
 * Returns cloud configuration helper providing simple configuration
 * generation witch chained methods
 * @param authURL
 */
export function cloud(authURL: string): CloudConfigHelper {
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

export type Metadata = Record<string, string>
