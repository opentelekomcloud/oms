import HttpClient, { joinURL } from '../../../core/http'
import isCidr from 'is-cidr'

export const url = '/vpcs'

export interface VPC {
    readonly id: string
    readonly name: string
    readonly description: string
    readonly cidr: string
    readonly status: 'CREATING' | 'OK'
    readonly routes: {
        readonly destination: string
        readonly nexthop: string
    }[]
    readonly enable_shared_snat?: boolean
}

export interface CreateOpts {
    name?: string
    description?: string
    cidr?: string
}

export async function listVPCs(client: HttpClient): Promise<VPC[]> {
    const resp = await client.get<{ vpcs: VPC[] }>({ url: url })
    return resp.data.vpcs
}

export async function createVPC(client: HttpClient, opts: CreateOpts): Promise<VPC> {
    if (opts.cidr && !isCidr(opts.cidr)) {
        throw Error(`Invalid CIDR: ${opts.cidr}`)
    }
    const resp = await client.post<{ vpc: VPC }>({ url: url, json: { vpc: opts } })
    return resp.data.vpc
}

export async function deleteVPC(client: HttpClient, vpcID: string): Promise<void> {
    await client.delete({ url: joinURL(url, vpcID) })
}

export async function getVPCStatus(client: HttpClient, vpcID: string): Promise<VPC> {
    const resp = await client.get<{ vpc: VPC }>({ url: joinURL(url, vpcID) })
    return resp.data.vpc
}

