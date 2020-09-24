import {randomString} from "../utils/helpers";
import _ from "lodash";
import HttpClient from "../../src/oms/core/http";
import {bareUrl, Service} from "../../src/oms/services/base";

test("Service_basic", () => {
    const type = randomString(5)
    const version = _.random(1, 10).toString()
    const url = randomString(10)
    const httpClient = new HttpClient()
    const serv = new Service(type, version, url, httpClient)
    expect(serv.type).toEqual(type)
    expect(serv.version).toEqual(version)
    expect(serv.client).toBeDefined()
    expect(serv.client!.baseURL).toEqual(url)
})

test("bareUrl", () => {
    const url = 'https://vpc.eu-de.otc.t-systems.com/v2.0/totallyrandomprojectid'
    expect(bareUrl(url)).toEqual('https://vpc.eu-de.otc.t-systems.com')
})
