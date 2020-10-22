import { normalizeDateTime } from '../../../core'
import HttpClient from '../../../core/http'
import { Page, Pager } from '../../base'

/**
 * Specifies the image status. The value can be one of the following:
 *
 * **queued:** indicates that the image metadata has already been created, and it is ready for the image file to upload.
 *
 * **saving**: indicates that the image file is being uploaded to the backend storage.
 *
 * **deleted**: indicates that the image has been deleted.
 *
 * **killed**: indicates that an error occurs on the image uploading.
 *
 * **active**: indicates that the image is available for use.
 */
type ImageStatus = 'queued' | 'saving' | 'deleted' | 'killed' | 'active'

/**
 * Specifies the member status.
 *
 * The value can be accepted, rejected, or pending.
 *
 * **accepted** indicates that the shared image is accepted.
 *
 * **rejected** indicates that the image shared by others is rejected.
 *
 * **pending** indicates that the image shared by others needs to be confirmed.
 *
 * To use this parameter, set Visibility to shared during the query.
 */
type MemberStatus = 'accepted' | 'rejected' | 'pending'

type Visibility = 'public' | 'private' | 'shared'
type Operator = 'gt' | 'gte' | 'lt' | 'lte' | 'eq' | 'neq'

interface TimeRange {
    readonly operator: Operator
    readonly date: string | Date
}

function rangeToString(range?: TimeRange): string | undefined {
    if (!range) {
        return range
    }
    return `${range.operator}:${normalizeDateTime(range.date)}`
}

export interface ListImageOpts {
    readonly protected?: boolean
    readonly visibility?: Visibility
    readonly owner?: string
    readonly id?: string
    readonly status?: ImageStatus
    readonly container_format?: string
    readonly disk_format?: string
    readonly min_ram?: number
    readonly min_disk?: number
    readonly os_type?: string
    readonly os_bit?: string
    readonly platform?: string
    readonly tag?: string
    readonly member_status?: MemberStatus
    // support_*
    readonly support_kvm?: boolean
    readonly support_xen?: boolean
    readonly support_largememory?: boolean
    readonly support_diskintensive?: boolean
    readonly support_highperformance?: boolean
    readonly support_xen_gpu_type?: boolean
    readonly support_kvm_gpu_type?: boolean
    readonly support_xen_hana?: boolean
    readonly support_kvm_infiniband?: boolean
    // time ranges
    readonly created_at?: TimeRange
    readonly updated_at?: TimeRange
    // sorting
    readonly sort_key?: string
    readonly sort_dir?: string
}

export interface Image {
    readonly id: string
    readonly protected: boolean
    readonly virtual_env_type: 'FusionCompute' | 'DataImage' | 'Ironic'
    readonly visibility: Visibility
    readonly owner: string
    readonly status: ImageStatus
    readonly name: string
    readonly container_format: string
    readonly disk_format: 'vhd' | 'raw' | 'zvhd' | 'qcow2'
    readonly min_ram: number
    readonly max_ram: number
    readonly min_disk: number
    readonly schema: string
    readonly self: string
    /* eslint-disable */
    readonly __backup_id?: string
    readonly __data_origin?: string
    readonly __description: string
    readonly __image_location: string
    readonly __image_size: number
    readonly __image_source_type: string
    readonly __is_config_init: boolean
    readonly __isregistered: boolean
    readonly __lazyloading: boolean
    readonly __originalimagename?: string
    readonly __imagetype: 'gold' | 'shared' | 'private'
    readonly __os_bit: string
    readonly __os_feature_list: string[]
    readonly __platform: string
    readonly __os_type: string
    readonly __os_version: string
    readonly __support_kvm: boolean
    readonly __support_xen: boolean
    readonly __support_largememory: boolean
    readonly __support_diskintensive: boolean
    readonly __support_highperformance: boolean
    readonly __support_xen_gpu_type: boolean
    readonly __support_kvm_gpu_type: boolean
    readonly __support_xen_hana: boolean
    readonly __support_kvm_infiniband: boolean
    readonly __productcode: string
    readonly __root_origin?: 'file'
    readonly __sequence_num: number
    /* eslint-enable */
    readonly tags: string[]
    readonly created_at: string
    readonly updated_at: string
    readonly active_at: string
    readonly deleted: boolean
    readonly deleted_at: string
    readonly hw_firmware_type: 'bios' | 'uefi'
    readonly file: string
}


function toQueryParams(opts?: ListImageOpts) {
    if (!opts) {
        return undefined
    }
    return {
        protected: opts.protected,
        visibility: opts.visibility,
        owner: opts.owner,
        id: opts.id,
        status: opts.status,
        container_format: opts.container_format,
        disk_format: opts.disk_format,
        min_ram: opts.min_ram,
        min_disk: opts.min_disk,
        tag: opts.tag,
        member_status: opts.member_status,
        /* eslint-disable */
        __os_type: opts.os_type,
        __os_bit: opts.os_bit,
        __platform: opts.platform,
        __support_kvm: opts.support_kvm,
        __support_xen: opts.support_xen,
        __support_largememory: opts.support_largememory,
        __support_diskintensive: opts.support_diskintensive,
        __support_highperformance: opts.support_highperformance,
        __support_xen_gpu_type: opts.support_xen_gpu_type,
        __support_kvm_gpu_type: opts.support_kvm_gpu_type,
        __support_xen_hana: opts.support_xen_hana,
        __support_kvm_infiniband: opts.support_kvm_infiniband,
        /* eslint-enable */
        created_at: rangeToString(opts.created_at),
        updated_at: rangeToString(opts.updated_at),
    }
}

export interface ImagePage extends Page {
    readonly images: Image[]
}

export function listImages(client: HttpClient, opts: ListImageOpts): Pager<ImagePage> {
    const params = toQueryParams(opts)
    return new Pager<ImagePage>({ url: '/v2/images', params: params }, client)
}
