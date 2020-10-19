import Service from '../../base'
import HttpClient from '../../../core/http'
import { ContainerACLs, Containers, createContainer, deleteContainer, listContainers } from './container'
import { Metadata } from '../../../core'

export class SwiftV1 extends Service {
    static readonly type: string = 'object-store'

    constructor(url: string, client: HttpClient) {
        super(url, client)
    }

    async createContainer(name: string, acls?: ContainerACLs, metadata?: Metadata): Promise<void> {
        await createContainer(this.client, name, acls, metadata)
    }

    async listContainers(): Promise<Containers> {
        return await listContainers(this.client)
    }

    async deleteContainer(name: string): Promise<void> {
        return await deleteContainer(this.client, name)
    }

}
