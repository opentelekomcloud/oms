/// <reference types="jest" />
import { cloudConfig } from '../../src/oms/core'
import { randomString } from '../utils/helpers'

test('CloudConfigHelper_basic', () => {
    const authUrl = randomString(5)
    const cc = cloudConfig(authUrl)
    const auth = cc.config.auth
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
    const cc = cloudConfig('')
    const domain = randomString(3)
    const username = randomString(3)
    const password = randomString(3)
    const project = randomString(3)
    const auth = cc.withPassword(domain, username, password, project).config.auth
    expect(auth.token).toBeUndefined()
    expect(auth.username).toEqual(username)
    expect(auth.password).toEqual(password)
    expect(auth.domain_name).toEqual(domain)
    expect(auth.project_name).toEqual(project)
    expect(auth.ak).toBeUndefined()
    expect(auth.sk).toBeUndefined()
})

test('CloudConfigHelper_token', () => {
    const cc = cloudConfig('')
    const token = randomString(10)
    const auth = cc.withToken(token).config.auth
    expect(auth.token).toEqual(token)
})

test('CloudConfigHelper_region', () => {
    const cc = cloudConfig('')
    const reg = randomString(4)
    const cfg = cc.withRegion(reg).config
    expect(cfg.region).toEqual(reg)
})

test('CloudConfigHelper_ak/sk', () => {
    const cc = cloudConfig('')
    const ak = randomString(5)
    const sk = randomString(10)
    const auth = cc.withAKSK(ak, sk).config.auth
    expect(auth.ak).toEqual(ak)
    expect(auth.sk).toEqual(sk)
})

test('CloudConfigHelper_appending', () => {
    const cc = cloudConfig('')
    const reg = randomString(4)
    const token = randomString(10)
    const cfg = cc
        .withRegion(reg)
        .withToken(token)
        .config
    expect(cfg.region).toEqual(reg)
    expect(cfg.auth.token).toEqual(token)
})
