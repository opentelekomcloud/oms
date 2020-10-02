import HttpClient from '../../../core/http'

const listURL = '/cloudservers/flavors'


export interface OSExtraSpecs {
    readonly 'ecs:performancetype': string
    readonly resource_type: string
    readonly 'instance_vnic:type': string
    readonly 'instance_vnic:instance_bandwidth': number
    readonly 'instance_vnic:max_count': number
    readonly 'quota:local_disk'?: string
    readonly 'quota:nvme_ssd'?: string
    readonly 'extra_spec:io:persistent_grant'?: boolean
    readonly 'ecs:generation'?: string
    readonly 'ecs:virtualization_env_types'?: string
    readonly 'pci_passthrough:enable_gpu'?: string
    readonly 'pci_passthrough:gpu_specs'?: string
    readonly 'pci_passthrough:alias'?: string
    readonly 'cond:operation:status': 'normal' | 'abandon' | 'sellout' | 'obt' | 'promotion'
    readonly 'cond:operation:az': string
    readonly 'quota:max_rate': string
    readonly 'quota:min_rate': string
    readonly 'quota:max_pps': string
    readonly 'cond:operation:charge'?: string
}

export interface Flavor {
    readonly id: string
    readonly name: string
    readonly vcpus: number
    readonly ram: number
    readonly disk: number
    readonly swap: string
    readonly 'os-flavor-access:is_public'?: boolean
    readonly links: {
        readonly rel: string
        readonly href: string
        readonly type: string
    }[]
    readonly os_extra_specs: OSExtraSpecs
}

export async function listFlavors(client: HttpClient, az?: string): Promise<Flavor[]> {
    const params = az ? { availability_zone: az } : undefined
    const resp = await client.get<{ flavors: Flavor[] }>({ url: listURL, params: params })
    return resp.data.flavors
}
