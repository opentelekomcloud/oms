import Service, { bareUrl, Pager } from '../../base'
import HttpClient from '../../../core/http'
import { ImagePage, ListImageOpts, listImages } from './images'


export class ImageV2 extends Service {
    static readonly type = 'image'

    constructor(url: string, httpClient: HttpClient) {
        super(bareUrl(url), httpClient)
    }

    listImages(opts?: ListImageOpts): Pager<ImagePage> {
        return listImages(this.client, opts ? opts : {})
    }
}
