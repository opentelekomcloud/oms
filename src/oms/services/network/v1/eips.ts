import HttpClient from '../../../core/http'

const url = 'publicips'

export interface PublicIP {
    id: string

    /**
     * Possible values are as follows:
     * - FREEZED (Frozen)
     * - BIND_ERROR (Binding failed)
     * - BINDING (Binding)
     * - PENDING_DELETE (Releasing)
     * - PENDING_CREATE (Assigning)
     * - PENDING_UPDATE (Updating)
     * - DOWN (Unbound)
     * - ACTIVE (Bound)
     * - ELB (Bound to a load balancer)
     * - ERROR (Exceptions)
     */
    status:
        'FREEZED' | 'BIND_ERROR' | 'BINDING' |
        'PENDING_DELETE' | 'PENDING_CREATE' | 'PENDING_UPDATE' |
        'DOWN' | 'ACTIVE' | 'ELB' | 'ERROR'

    /**
     *  Specifies the EIP type.
     *
     *  Constraints:
     *     - The configured value must be supported by the system.
     *     - `PublicIP.id` is an IPv4 port. If PublicIP.type is not specified, the default value is `5_bgp`.
     */
    type: string

    /**
     * Specifies the obtained EIP if only IPv4 EIPs are available.
     */
    public_ip_address: string

    /**
     * Specifies the private IP address bound with the EIP.
     * This parameter is returned only when a private IP address is bound with the EIP.
     */
    private_ip_address?: string

    /**
     * Specifies the port ID.
     * This parameter is returned only when a private IP address is bound with the EIP.
     */
    port_id?: string

    /**
     * Specifies the time (UTC time) when the EIP was assigned.
     */
    create_time: string

    /**
     * Specifies the ID of the bandwidth associated with the EIP.
     */
    bandwidth_id: string

    /**
     * Specifies the bandwidth (Mbit/s).
     */
    bandwidth_size: number

    /**
     * Specifies the EIP bandwidth type.
     * The value can be PER or WHOLE.
     * - PER: Dedicated bandwidth
     * - WHOLE: Shared bandwidth
     */
    bandwidth_share_type: string
}

export async function listPublicIPs(client: HttpClient): Promise<PublicIP[]> {
    const resp = await client.get<{ 'publicips': PublicIP[] }>({ url: url })
    return resp.data.publicips
}
