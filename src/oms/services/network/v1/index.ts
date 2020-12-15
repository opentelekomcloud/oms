import Service, { waitFor, waitForResourceToBeDeleted } from '../../base'
import HttpClient, { HttpError } from '../../../core/http'
import {
    CreateOpts as VPCCreateOpts,
    createVPC,
    deleteVPC,
    getVPCStatus,
    listVPCs,
    UpdateOpts,
    updateVPC,
    VPC,
} from './vpcs'
import {
    CreateOpts as SubnetCreateOpts,
    createSubnet,
    deleteSubnet,
    getSubnetStatus,
    listSubnets,
    Subnet,
} from './subnets'
import {
    CreateOpts as SGCreateOpts,
    createSecurityGroup,
    deleteSecurityGroup,
    ListOpts as SecGroupListOpts,
    listSecurityGroups,
    SecurityGroup,
} from './secgroups'
import { listPublicIPs, PublicIP } from './eips'

export { VPC } from './vpcs'
export { Subnet } from './subnets'

/**
 * VPC v1 service client
 */
export class VpcV1 extends Service {
    static readonly type = 'vpc'

    constructor(url: string, client: HttpClient) {
        super(url, client)
    }

    /**
     * Get list of all existing VPCs
     */
    async listVPCs(): Promise<VPC[]> {
        return await listVPCs(this.client)
    }

    /**
     * Create new VPC
     * @param opts
     */
    async createVPC(opts: VPCCreateOpts): Promise<VPC> {
        const { id } = await createVPC(this.client, opts)
        let state = await this.getVPC(id)  // mutable state for waiting
        const statusOK = async () => {
            state = await this.getVPC(id)
            return state.status === 'OK'
        }
        if (await statusOK()) {
            return state
        }
        await waitFor(statusOK, 60)
        return state
    }

    /**
     * Get existing VPC details
     * @param vpcID
     */
    async getVPC(vpcID: string): Promise<VPC> {
        return await getVPCStatus(this.client, vpcID)
    }

    /**
     * Update existing VPC
     * @param vpcID
     * @param opts
     */
    async updateVPC(vpcID: string, opts: UpdateOpts): Promise<VPC> {
        return await updateVPC(this.client, vpcID, opts)
    }

    /**
     * Delete existing VPC
     * @param vpcID
     */
    async deleteVPC(vpcID: string): Promise<void> {
        try {
            await deleteVPC(this.client, vpcID)
        } catch (e) {
            if (e instanceof HttpError && e.statusCode === 404) {
                return
            }
            throw e
        }
        await waitForResourceToBeDeleted(() => this.getVPC(vpcID), 60)
    }

    /**
     * List existing subnets
     * @param vpcID
     */
    async listSubnets(vpcID?: string): Promise<Subnet[]> {
        return await listSubnets(this.client, vpcID)
    }

    /**
     * Get existing subnet by ID
     * @param subnetID
     */
    async getSubnet(subnetID: string): Promise<Subnet> {
        return await getSubnetStatus(this.client, subnetID)
    }

    /**
     * Create new subnet with given opts
     * @param opts
     */
    async createSubnet(opts: SubnetCreateOpts): Promise<Subnet> {
        const { id } = await createSubnet(this.client, opts)
        let state = await this.getSubnet(id)
        const statusActive = async () => {
            state = await this.getSubnet(id)
            return state.status === 'ACTIVE'
        }
        if (await statusActive()) {
            return state
        }
        await waitFor(statusActive, 120)
        return state
    }

    /**
     * Delete existing subnet by ID
     * @param subnetID
     * @param vpcID - (optional) subnet`s VPC
     */
    async deleteSubnet(subnetID: string, vpcID?: string): Promise<void> {
        if (!vpcID) {
            const sn = await this.getSubnet(subnetID)
            vpcID = sn.vpc_id
        }
        await deleteSubnet(this.client, vpcID, subnetID)
        await waitForResourceToBeDeleted(() => this.getSubnet(subnetID), 120)
    }

    /**
     * List existing security groups
     * @param opts
     */
    async listSecurityGroups(opts?: SecGroupListOpts): Promise<SecurityGroup[]> {
        if (!opts) {
            opts = {}
        }
        return listSecurityGroups(this.client, opts)
    }

    /**
     * Create new security group
     * @param opts
     */
    async createSecurityGroup(opts: SGCreateOpts): Promise<SecurityGroup> {
        return createSecurityGroup(this.client, opts)
    }

    /**
     * Delete existing security group
     * @param id
     */
    async deleteSecurityGroup(id: string): Promise<void> {
        return deleteSecurityGroup(this.client, id)
    }

    /**
     * List all public IPs assigned to the project
     */
    async listPublicIPs(): Promise<PublicIP[]> {
        return listPublicIPs(this.client)
    }
}
