import HttpClient, { joinURL, QueryParams } from '../../../core/http'

const url = '/security-groups'

export interface SecurityGroupRole {
    readonly id: string
    readonly description: string
    readonly security_group_id: string
    readonly direction: 'egress' | 'ingress'
    readonly ethertype: 'IPv4' | 'IPv6'
    readonly protocol: 'icmp' | 'tcp' | 'udp' | ''
    readonly port_range_min: number
    readonly port_range_max: number
    readonly remote_ip_prefix?: string
    readonly remote_group_id?: string
    readonly tenant_id: string
}

export interface SecurityGroup {
    readonly id: string
    readonly name: string
    readonly description: string
    readonly vpc_id?: string  // deprecated
    readonly security_group_rules: SecurityGroupRole[]
}

export interface ListOpts extends QueryParams {
    readonly vpc_id?: string
}

export async function listSecurityGroups(client: HttpClient, opts: ListOpts): Promise<SecurityGroup[]> {
    const resp = await client.get<{ security_groups: SecurityGroup[] }>({ url: url, params: opts })
    return resp.data.security_groups
}

export interface CreateOpts {
    readonly name: string
}

const sgNameRe = /^[\w\d.\-]{1,64}$/

export async function createSecurityGroup(client: HttpClient, opts: CreateOpts): Promise<SecurityGroup> {
    if (!opts.name.match(sgNameRe)) {
        throw Error(`Invalid Security Group name: "${opts.name}".\nThe value should be a string of 1 to 64 characters that can contain letters, digits, underscores (_), hyphens (-), and periods (.).`)
    }
    const resp = await client.post<{ security_group: SecurityGroup }>({ url: url, json: { security_group: opts } })
    return resp.data.security_group
}

export async function deleteSecurityGroup(client: HttpClient, id: string): Promise<void> {
    await client.delete({ url: joinURL(url, id) })
}

