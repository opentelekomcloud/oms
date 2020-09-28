/// <reference types="jest" />
import { CloudConfigHelper } from '../../src/oms/core/types';
import { randomString } from '../utils/helpers';

test('CloudConfigHelper_basic', () => {
    const authUrl = randomString(5)
    const cc = new CloudConfigHelper(authUrl)
    const auth = cc.baseCfg().auth
    expect(auth.auth_url).toEqual(authUrl)
    expect(auth.token).toBeUndefined()
    expect(auth.username).toBeUndefined()
    expect(auth.password).toBeUndefined()
    expect(auth.domain_name).toBeUndefined()
    expect(auth.project_name).toBeUndefined()
    expect(auth.ak).toBeUndefined()
    expect(auth.sk).toBeUndefined()
})

test('CloudConfigHelper_pwd', () => {
    const cc = new CloudConfigHelper('')
    const domain = randomString(3)
    const username = randomString(3)
    const password = randomString(3)
    const project = randomString(3)
    const auth = cc.simplePasswordConfig(domain, username, password, project).auth
    expect(auth.token).toBeUndefined()
    expect(auth.username).toEqual(username)
    expect(auth.password).toEqual(password)
    expect(auth.domain_name).toEqual(domain)
    expect(auth.project_name).toEqual(project)
    expect(auth.ak).toBeUndefined()
    expect(auth.sk).toBeUndefined()
})

test('CloudConfigHelper_token', () => {
    const cc = new CloudConfigHelper('')
    const token = randomString(10)
    const auth = cc.simpleTokenConfig(token).auth
    expect(auth.token).toEqual(token)
})

test('CloudConfigHelper_ak/sk', () => {
    const cc = new CloudConfigHelper('')
    const ak = randomString(5)
    const sk = randomString(10)
    const auth = cc.simpleAkSkConfig(ak, sk).auth
    expect(auth.ak).toEqual(ak)
    expect(auth.sk).toEqual(sk)
})
