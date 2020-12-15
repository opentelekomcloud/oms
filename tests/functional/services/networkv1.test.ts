import { Client, cloud, VpcV1 } from '../../../src/oms'
import { randomString } from '../../utils/helpers'
import { Subnet, VPC } from '../../../src/oms/services/network/v1'

const t = process.env.OS_TOKEN
if (!t) {
    throw 'Missing OS_TOKEN required for tests'
}
const authUrl = 'https://iam.eu-de.otc.t-systems.com/v3'
const config = cloud(authUrl).withToken(t).config
const client = new Client(config)

const orphans: {
    vpcs: VPC[]
    subnets: Subnet[]
} = { vpcs: [], subnets: [] }

jest.setTimeout(1000000)  // for debug

beforeAll(async () => {
    await client.authenticate()
})

afterAll(async () => {
    await client.authenticate()
    const nw = client.getService(VpcV1)
    for (const subnet of orphans.subnets) {
        await nw.deleteSubnet(subnet.id, subnet.vpc_id)
    }
    await Promise.all([
        orphans.subnets.map(subnet => nw.deleteSubnet(subnet.id, subnet.vpc_id)),
    ])
    await Promise.all([
        orphans.vpcs.map(vpc => nw.deleteVPC(vpc.id)),
    ])
})

test('VPC/Subnet: lifecycle', async () => {
    const nw = client.getService(VpcV1)
    const name = 'oms-test-vpc'
    const cidr = '192.168.0.0/16'
    const description = randomString(10)
    let vpc = await nw.createVPC({
        name: name,
        cidr: cidr,
        description: description,
    })
    expect(vpc).toBeDefined()
    expect(vpc.id).toBeDefined()
    orphans.vpcs.push(vpc)
    expect(vpc.status).toBe('OK')
    expect(vpc.name).toBe(name)
    expect(vpc.cidr).toBe(cidr)
    expect(vpc.description).toBe(description)
    expect(vpc.enable_shared_snat).toBe(false)
    const vpcList = await nw.listVPCs()
    expect(vpcList.find(v => v.id === vpc.id)).toBeDefined()

    const updatedVPC = await nw.updateVPC(vpc.id, { enable_shared_snat: true })
    expect(updatedVPC.id).toBe(vpc.id)
    expect(updatedVPC.enable_shared_snat).toBe(true)
    vpc = await nw.getVPC(vpc.id)
    expect(vpc.enable_shared_snat).toBe(true)

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
    orphans.subnets.push(subnet)
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
    orphans.subnets.splice(orphans.subnets.indexOf(subnet))

    await nw.deleteVPC(vpc.id)
    orphans.vpcs.splice(orphans.vpcs.indexOf(vpc))
})

test('Sec Groups: lifecycle', async () => {
    const nw = client.getService(VpcV1)
    const sgOpts = {
        name: 'oms-test-sg',
    }
    const sg = await nw.createSecurityGroup(sgOpts)
    expect(sg).toHaveProperty('id')
    expect(sg.security_group_rules.length).toBe(2)  // default rules

    let sgs = await nw.listSecurityGroups({})
    expect(sgs.find(s => s.id === sg.id)).toBeTruthy()

    sgs = await nw.listSecurityGroups()
    expect(sgs.find(s => s.id === sg.id)).toBeTruthy()

    await nw.deleteSecurityGroup(sg.id)
    sgs = await nw.listSecurityGroups()
    expect(sgs.find(s => s.id === sg.id)).not.toBeTruthy()
})

test('Public IP: list', async () => {
    const nw = client.getService(VpcV1)
    const ips = await nw.listPublicIPs()
    expect(ips).toHaveProperty('length')
})
