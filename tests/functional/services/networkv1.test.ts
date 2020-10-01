import { cloudConfig } from '../../../src/oms/core/types'
import Client from '../../../src/oms'
import { VpcV1 } from '../../../src/oms/services/network'
import { randomString } from '../../utils/helpers'
import { Subnet, VPC } from '../../../src/oms/services/network/v1'

const t = process.env.OS_TOKEN
if (!t) {
    throw 'Missing OS_TOKEN required for tests'
}
const authUrl = 'https://iam.eu-de.otc.t-systems.com/v3'
const config = cloudConfig(authUrl).withToken(t)
const client = new Client(config)

const orphans: {
    vpc?: VPC
    subnet?: Subnet
} = {}

jest.setTimeout(1000000)  // for debug

beforeAll(async () => {
    await client.authenticate()
})

afterAll(async () => {
    await client.authenticate()
    const nw = client.getService(VpcV1)
    if (orphans.subnet) {
        await nw.deleteSubnet(orphans.subnet.id, orphans.subnet.vpc_id)
    }
    if (orphans.vpc) {
        await nw.deleteVPC(orphans.vpc.id)
    }
})

test('VPC/Subnet: lifecycle', async () => {
    const nw = client.getService(VpcV1)
    const name = 'oms-test-vpc'
    const cidr = '192.168.0.0/16'
    const description = randomString(10)
    const vpc = await nw.createVPC({
        name: name,
        cidr: cidr,
        description: description,
    })
    expect(vpc).toBeDefined()
    expect(vpc.id).toBeDefined()
    orphans.vpc = vpc
    expect(vpc.status).toBe('OK')
    expect(vpc.name).toBe(name)
    expect(vpc.cidr).toBe(cidr)
    expect(vpc.description).toBe(description)
    const vpcList = await nw.listVPCs()
    expect(vpcList.find(v => v.id === vpc.id)).toBeDefined()

    const opts = {
        vpc_id: vpc.id,
        name: 'oms-test-subnet',
        cidr: '192.168.0.0/24',
        availability_zone: 'eu-de-03',
        gateway_ip: '192.168.0.1',
    }
    const subnet = await nw.createSubnet(opts)
    expect(subnet).toBeDefined()
    expect(subnet.id).toBeDefined()
    orphans.subnet = subnet
    expect(subnet.vpc_id).toBe(vpc.id)
    expect(subnet.name).toBe(opts.name)
    expect(subnet.cidr).toBe(opts.cidr)
    expect(subnet.availability_zone).toBe(opts.availability_zone)
    expect(subnet.description).toBe('')
    expect(subnet.gateway_ip).toBe(opts.gateway_ip)
    expect(subnet.neutron_network_id).toBeDefined()
    expect(subnet.neutron_subnet_id).toBeDefined()

    let snList = await nw.listSubnets()
    expect(snList.find(s => s.id === subnet.id)).toBeDefined()
    snList = await nw.listSubnets(vpc.id)
    expect(snList.find(s => s.id === subnet.id)).toBeDefined()

    await nw.deleteSubnet(subnet.id)
    orphans.subnet = undefined

    await nw.deleteVPC(vpc.id)
    orphans.vpc = undefined
})

