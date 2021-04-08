import Service, { Pager } from '../../base'
import { ImagePage, ListImageOpts, listImages } from './images'
import HttpClient from '../../../core/http'


export class ImageV2 extends Service {
    static readonly type = 'image'

    constructor(url: string, httpClient: HttpClient) {
        super(url, httpClient)
    }

    listImages(opts?: ListImageOpts): Pager<ImagePage> {
        return listImages(this.client, opts ? opts : {})
    }
}
