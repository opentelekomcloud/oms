import Client from "../../../src/oms/client";
import {CloudConfig, CloudConfigHelper} from "../../../src/oms/core/types";
import ImageV2 from "../../../src/oms/services/image";

let defaultConfig: CloudConfig
let defaultClient: Client

const authUrl = 'https://iam.eu-de.otc.t-systems.com/v3'

jest.setTimeout(10000)

beforeAll(() => {
    const t = process.env.OS_TOKEN
    if (!t) {
        throw 'Missing OS_TOKEN required for tests'
    }
    defaultConfig = new CloudConfigHelper(authUrl).simpleTokenConfig(t)
    defaultClient = new Client(defaultConfig)
})

test("List images", async () => {
    await defaultClient.authenticate()
    const ims = defaultClient!.getService(ImageV2)
    const images = await ims.listImages()
    expect(images.length).toBeTruthy()
})
