import HttpClient from '../../../core/http'
import { Account, AccountWithContainers, Container } from './types'
import { Metadata } from '../../../core'

const url = ''

const metadataPrefix = 'X-Account-Meta-'.toLowerCase()
const maxQuota = 9223372036854775807

function parseAccountHeaders(headers: Headers): Account {
    const metadata: Metadata = {}
    let bytesUsed = 0
    let containerCount = 0
    let objectCount = 0
    let domainID = ''
    headers.forEach((v, k) => {
        if (k.startsWith(metadataPrefix)) {
            const mKey = k.replace(metadataPrefix, '')
            metadata[mKey] = v
            return
        }
        switch (k.toLowerCase()) {
        case 'x-account-object-count':
            objectCount = Number.parseInt(v)
            return
        case 'x-account-container-count':
            containerCount = Number.parseInt(v)
            return
        case 'x-account-bytes-used':
            bytesUsed = Number.parseInt(v)
            return
        case 'x-account-project-domain-id':
            domainID = v
            return
        }
    })
    return {
        domainID: domainID,
        bytesUsed: bytesUsed,
        containerCount: containerCount,
        metadata: metadata,
        objectCount: objectCount,
    }
}

/**
 * Get account details and list containers
 */
export async function getAccount(client: HttpClient): Promise<AccountWithContainers> {
    const resp = await client.get<Container[]>({ url: url, params: { format: 'json' } })
    const account = parseAccountHeaders(resp.headers)
    return {
        containers: resp.data,
        ...account,
    }
}

/**
 * Update account metadata
 * @param client
 * @param metadata
 * @param quota - Configures the tenant quota. The value ranges from `0` to `9223372036854775807`.
 * After setting the quota, the quota will be checked each time you upload or copy an object,
 * or modify the metadata of an object or bucket. If set to -1, quota will be removed.
 */
export async function updateAccountMetadata(client: HttpClient, metadata?: Metadata, quota?: number): Promise<void> {
    const headers = new Headers()
    if (metadata) {
        for (const [k, v] of Object.entries(metadata)) {
            headers.append(metadataPrefix + k, v)
        }
    }
    if (quota != null) {
        if (!Number.isInteger(quota) || quota > maxQuota) {
            throw Error(`Invalid quota value: ${quota}`)
        }
        if (quota < 0) {
            headers.append('X-Remove-Account-Meta-Quota-Bytes', 'yes')
        } else {
            headers.append('X-Account-Meta-Quota-Bytes', quota.toString())
        }
    }
    await client.post({ url: url, headers: headers })
}

export async function showAccountMetadata(client: HttpClient): Promise<Account> {
    const resp = await client.request<Container[]>({ method: 'HEAD', url: url, params: { format: 'json' } })
    return parseAccountHeaders(resp.headers)
}
