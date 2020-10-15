import Service from '../../base'
import HttpClient from '../../../core/http'
import { ContainerACLs, createContainer, listContainers } from './container'
import { Metadata } from '../../../core'

export class SwiftV1 extends Service {
    static readonly type: string = 'object-store'

    constructor(url: string, client: HttpClient) {
        super(url, client)
    }

    async createContainer(name: string, acls?: ContainerACLs, metadata?: Metadata): Promise<void> {
        await createContainer(this.client, name, acls, metadata)
    }

    async listContainers(): Promise<unknown> {
        return await listContainers(this.client)
    }

}
