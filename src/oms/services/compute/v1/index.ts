import Service from '../../base'
import HttpClient from '../../../core/http'
import { Flavor, listFlavors } from './flavors'

const groupInfoRe = /^(.*?)\((.*?)\)$/
const normal = 'normal'

/**
 * Compute v1 (ECS) service client
 */
export class ComputeV1 extends Service {
    static readonly type: string = 'ecs'

    constructor(url: string, client: HttpClient) {
        super(url, client)
    }

    /**
     * List all flavors available
     */
    async listFlavors(az?: string): Promise<Flavor[]> {
        const flavors = await listFlavors(this.client, az)
        if (!az) {
            return flavors
        }
        // AZ filtering is not working on server side, so still need to filter it
        return flavors.filter(f => {
            const azs = f.os_extra_specs['cond:operation:az'] || ''
            return azs.split(',').find(a => {
                const items = a.match(groupInfoRe)
                return (!!items) &&
                    (items.length === 3) &&
                    (items[1] === az) &&
                    (items[2] === normal)
            })
        })
    }
}
