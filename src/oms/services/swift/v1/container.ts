import HttpClient, { joinURL } from '../../../core/http'
import { Metadata } from '../../../core'

const url = ''

export interface ContainerACLs {
    /**
     * Container **read** ACL rules are as follows:
     *
     * `.r:*#`: All referrers
     *
     * `.r:example.com,swift.example.com#`: Comma-separated list of referrers
     *
     * `.rlistings#`: Container listing access, always combined with `.r:`
     *
     * `.r:-example.com`#: Comma-separated list of inaccessible addresses
     *
     * `{account:user} #`: account is projectid and user is userid
     *
     */
    readonly read?: string
    /**
     * Container **write** ACL rules are as follows:
     *
     * `{account:user} #`: Only this format is supported. account is projectid and user is userid.
     */
    readonly write?: string
}


export async function createContainer(client: HttpClient, name: string, acl?: ContainerACLs, metadata?: Metadata): Promise<void> {
    const headers = new Headers()
    if (acl) {
        if (acl.read) {
            headers.append('X-Container-Read', acl.read)
        }
        if (acl.write) {
            headers.append('X-Container-Write', acl.write)
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

export async function deleteContainer(client: HttpClient, name: string): Promise<void> {
    await client.delete({ url: joinURL(url, name) })
}
