/// <reference types="jest" />
import {CloudConfigHelper} from "../../src/oms/core/types";

test("Config generation", () => {
    const cc = new CloudConfigHelper('')
    const config = cc.baseCfg()
    expect(config.auth.auth_url).toEqual('')
})
