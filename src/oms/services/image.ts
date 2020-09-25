import Service, {bareUrl} from "./base";
import HttpClient from "../core/http";

class image {

}

export class ImageListOpts {

}

export default class ImageV2 extends Service {
    static readonly type = 'image'
    static readonly version = '2'

    constructor(url: string, httpClient: HttpClient) {
        super(bareUrl(url), httpClient)
    }

    async listImages(): Promise<image[]> {
        const response = await this.client.get<{images: image[]}>({url: '/v2/images'})
        return response.data.images
    }
}
