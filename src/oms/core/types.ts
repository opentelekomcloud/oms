export class NameOrID {
    id?: string
    name?: string
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

    constructor() {
        this.auth = new (AuthOptions)()
    }
}

/**
 * CloudConfigHelper provides helper functions to get cloud configurations
 */
export class CloudConfigHelper {
    authUrl: string

    constructor(authUrl: string) {
        this.authUrl = authUrl
    }

    baseCfg(): CloudConfig {
        const cc = new (CloudConfig)()
        cc.auth.auth_url = this.authUrl
        return cc
    }

    simplePasswordConfig(domainName: string, username: string, password: string, projectName: string): CloudConfig {
        const cc = this.baseCfg()
        cc.auth.domain_name = domainName
        cc.auth.username = username
        cc.auth.password = password
        cc.auth.project_name = projectName
        return cc
    }

    simpleTokenConfig(token: string): CloudConfig {
        const cc = this.baseCfg()
        cc.auth.token = token
        return cc
    }

    simpleAkSkConfig(ak: string, sk: string): CloudConfig {
        const cc = this.baseCfg()
        cc.auth.ak = ak
        cc.auth.sk = sk
        return cc
    }
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
