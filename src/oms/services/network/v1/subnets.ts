import HttpClient, { joinURL } from '../../../core/http'
import isCidr from 'is-cidr'
import { url as vpcURL } from './vpcs'

const url = '/subnets'

export interface ExtraDHCPOpt {
    readonly opt_value: string
    readonly opts_name: string
}

export interface Subnet {
    readonly id: string
    readonly name: string
    readonly description: string
    readonly cidr: string
    readonly gateway_ip: string
    readonly dhcp_enable: boolean
    readonly primary_dns: string
    readonly secondary_dns: string
    readonly dnsList: string[]
    readonly availability_zone: string
    readonly vpc_id: string
    readonly status: 'ACTIVE' | 'UNKNOWN' | 'ERROR'
    readonly neutron_network_id: string
    readonly neutron_subnet_id: string
    readonly extra_dhcp_opts: ExtraDHCPOpt[]
}

export interface CreateOpts {
    readonly name: string
    readonly description?: string
    readonly cidr: string
    readonly gateway_ip: string
    readonly dhcp_enable?: boolean
    readonly primary_dns?: string
    readonly secondary_dns?: string
    readonly dnsList?: string[]
    readonly availability_zone?: string
    readonly vpc_id: string
    readonly extra_dhcp_opts?: ExtraDHCPOpt[]
}

export async function listSubnets(client: HttpClient, vpcID?: string): Promise<Subnet[]> {
    let params = {}
    if (vpcID) {
        params = { vpc_id: vpcID }
    }
    const resp = await client.get<{ subnets: Subnet[] }>({ url: url, params: params })
    return resp.data.subnets
}

export async function createSubnet(client: HttpClient, opts: CreateOpts): Promise<Subnet> {
    if (opts.cidr && !isCidr(opts.cidr)) {
        throw Error(`Invalid CIDR: ${opts.cidr}`)
    }
    const resp = await client.post<{ subnet: Subnet }>({ url: url, json: { subnet: opts } })
    return resp.data.subnet
}

export async function getSubnetStatus(client: HttpClient, subnetID: string): Promise<Subnet> {
    const resp = await client.get<{ subnet: Subnet }>({ url: joinURL(url, subnetID) })
    return resp.data.subnet
}

export async function deleteSubnet(client: HttpClient, vpcID: string, subnetID: string): Promise<void> {
    const deleteURL = joinURL(vpcURL, vpcID, url, subnetID)
    await client.delete({ url: deleteURL })
}
