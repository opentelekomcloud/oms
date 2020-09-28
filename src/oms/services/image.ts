import Service, {bareUrl, Pager} from "./base";
import HttpClient from "../core/http";
import {normalizeDateTime} from "../core/types";

class image {

}


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
type imageStatus = 'queued' | 'saving' | 'deleted' | 'killed' | 'active'

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
 * To use this parameter, set visibility to shared during the query.
 */
type memberStatus = 'accepted' | 'rejected' | 'pending'


type visibility = 'public' | 'private' | 'shared'
type operator = 'gt' | 'gte' | 'lt' | 'lte' | 'eq' | 'neq'

interface timeRange {
    operator: operator
    date: string | Date
}

function rangeToString(range?: timeRange): string | undefined {
    if (!range) {
        return range
    }
    return `${range.operator}:${normalizeDateTime(range.date)}`
}

export interface ListImageOpts {
    readonly protected?: boolean
    readonly visibility?: visibility
    readonly owner?: string
    readonly id?: string
    readonly status?: imageStatus
    readonly container_format?: string
    readonly disk_format?: string
    readonly min_ram?: number
    readonly min_disk?: number
    readonly os_type?: string
    readonly os_bit?: string
    readonly platform?: string
    readonly tag?: string
    readonly member_status?: memberStatus
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
    readonly created_at?: timeRange
    readonly updated_at?: timeRange
    // sorting
    readonly sort_key?: string
    readonly sort_dir?: string
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
        created_at: rangeToString(opts.created_at),
        updated_at: rangeToString(opts.updated_at),
    }
}

export interface ImagePage {
    readonly first: string
    readonly next?: string
    readonly schema: string
    readonly images: image[]
}

export default class ImageV2 extends Service {
    static readonly type = 'image'
    static readonly version = '2'

    constructor(url: string, httpClient: HttpClient) {
        super(bareUrl(url), httpClient)
    }

    listImages(opts?: ListImageOpts) {
        const params = toQueryParams(opts)
        return new Pager<ImagePage>({url: '/v2/images', params: params}, this.client)
    }
}
