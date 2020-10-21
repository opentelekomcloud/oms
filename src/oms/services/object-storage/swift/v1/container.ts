import HttpClient, { joinURL } from '../../../../core/http'
import { Metadata } from '../../../../core'
import { Container, ContainerMetadata, ObjectEntity, ObjectListOpts } from './types'

const url = ''

export interface ContainerACLs {
    /**
     * ContainerMetadata **read** ACL rules are as follows:
     *
     * `.r:*#`: All referrers
     *
     * `.r:example.com,swift.example.com#`: Comma-separated list of referrers
     *
     * `.rlistings#`: ContainerMetadata listing access, always combined with `.r:`
     *
     * `.r:-example.com`#: Comma-separated list of inaccessible addresses
     *
     * `{account:user} #`: account is projectid and user is userid
     *
     */
    readonly read?: string
    /**
     * ContainerMetadata **write** ACL rules are as follows:
     *
     * `{account:user} #`: Only this format is supported. account is projectid and user is userid.
     */
    readonly write?: string
}


export async function createContainer(client: HttpClient, name: string, acl?: ContainerACLs, metadata?: Metadata): Promise<void> {
    const headers = new Headers()
    if (acl) {
        if (acl.read) {
            headers.append('X-ContainerMetadata-Read', acl.read)
        }
        if (acl.write) {
            headers.append('X-ContainerMetadata-Write', acl.write)
        }
    }
    if (metadata) {
        for (const [key, value] of Object.entries(metadata)) {
            headers.append(`X-Container-Meta-${key}`, value)
        }
    }
    await client.put({
        url: joinURL(url, name),
        headers: headers,
    })
}

const metadataPrefix = 'X-Container-Meta-'.toLowerCase()

function parseContainerHeaders(name: string, headers: Headers): ContainerMetadata {
    const metadata: Metadata = {}
    let objectCount = 0
    let bytesUsed = 0
    let created: number | undefined = undefined
    headers.forEach((v, k) => {
        if (k.startsWith(metadataPrefix)) {
            const mKey = k.replace(metadataPrefix, '')
            metadata[mKey] = v
            return
        }
        switch (k.toLowerCase()) {
        case 'x-container-object-count':
            objectCount = Number.parseInt(v)
            return
        case 'x-container-bytes-used':
            bytesUsed = Number.parseInt(v)
            return
        case 'x-timestamp':
            created = Number.parseFloat(v)
            return
        }
    })
    return {
        bytes: bytesUsed,
        count: objectCount,
        created: created,
        name: name,
        metadata: metadata,
    }
}

export async function getContainer(client: HttpClient, name: string, opts?: ObjectListOpts): Promise<Container> {
    const resp = await client.get<{ objects: ObjectEntity[] }>({ url: joinURL(url, name), params: opts })
    return {
        ...parseContainerHeaders(name, resp.headers),
        ...resp.data,
    }
}

export async function showContainerMetadata(client: HttpClient, name: string): Promise<ContainerMetadata> {
    const resp = await client.head({ url: joinURL(url, name) })
    return parseContainerHeaders(name, resp.headers)
}

export async function deleteContainer(client: HttpClient, name: string): Promise<void> {
    await client.delete({ url: joinURL(url, name) })
}
