/// <reference types="jest" />
import {bareUrl, CloudConfigHelper, Service} from "../../src/oms/core/types";
import {randomString} from "../utils/helpers";
import _ from "lodash";
import axios from "axios";

test("CloudConfigHelper_basic", () => {
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

test("CloudConfigHelper_pwd", () => {
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

test("CloudConfigHelper_token", () => {
    const cc = new CloudConfigHelper('')
    const token = randomString(10)
    const auth = cc.simpleTokenConfig(token).auth
    expect(auth.token).toEqual(token)
})

test("CloudConfigHelper_ak/sk", () => {
    const cc = new CloudConfigHelper('')
    const ak = randomString(5)
    const sk = randomString(10)
    const auth = cc.simpleAkSkConfig(ak, sk).auth
    expect(auth.ak).toEqual(ak)
    expect(auth.sk).toEqual(sk)
})

test("Service_basic", () => {
    const type = randomString(5)
    const version = _.random(1, 10).toString()
    const url = randomString(10)
    const httpClient = axios.create({})
    const serv = new Service(type, version, url, httpClient)
    expect(serv.type).toEqual(type)
    expect(serv.version).toEqual(version)
    expect(serv.httpClient).toBeDefined()
    expect(serv.httpClient!.defaults.baseURL).toEqual(url)
})

test("Service_noClient", () => {
    const type = randomString(5)
    const version = _.random(1, 10).toString()
    const url = randomString(10)
    const serv = new Service(type, version, url)
    expect(serv.httpClient).toBeDefined()
})

test("bareUrl", () => {
    const url = 'https://vpc.eu-de.otc.t-systems.com/v2.0/totallyrandomprojectid'
    expect(bareUrl(url)).toEqual('https://vpc.eu-de.otc.t-systems.com/')
})
