import Service from '../../../base'
import HttpClient from '../../../../core/http'
import { ContainerACLs, createContainer, deleteContainer, getContainer, showContainerMetadata } from './container'
import { Metadata } from '../../../../core'
import { Account, AccountMetadata, Container, ContainerMetadata, ObjectListOpts } from './types'
import { getAccount, showAccountMetadata, updateAccountMetadata } from './accounts'

export class SwiftV1 extends Service {
    static readonly type: string = 'object-store'

    constructor(url: string, client: HttpClient) {
        super(url, client)
    }

    /**
     * Get AccountMetadata details and container list
     */
    async getAccount(): Promise<Account> {
        return await getAccount(this.client)
    }

    /**
     * Get AccountMetadata details
     */
    async showAccountMetadata(): Promise<AccountMetadata> {
        return await showAccountMetadata(this.client)
    }

    /**
     * Update account metadata
     * @param metadata
     * @param quota - Configures the tenant quota. The value ranges from `0` to `9223372036854775807`.
     * After setting the quota, the quota will be checked each time you upload or copy an object,
     * or modify the metadata of an object or bucket. If set to -1, quota will be removed.
     */
    async updateAccountMetadata(metadata?: Metadata, quota?: number): Promise<void> {
        return await updateAccountMetadata(this.client, metadata, quota)
    }

    async createContainer(name: string, acls?: ContainerACLs, metadata?: Metadata): Promise<void> {
        await createContainer(this.client, name, acls, metadata)
    }

    async listContainers(): Promise<ContainerMetadata[]> {
        return (await this.getAccount()).containers
    }

    async showContainerMetadata(name: string): Promise<ContainerMetadata> {
        return await showContainerMetadata(this.client, name)
    }

    async getContainer(name: string, objectListOpts?: ObjectListOpts): Promise<Container> {
        return await getContainer(this.client, name, objectListOpts)
    }

    async deleteContainer(name: string): Promise<void> {
        return await deleteContainer(this.client, name)
    }

}
