import _ from "lodash";

const defaultCharset = "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ".split('')

export function randomString(size: number): string {
    const samp = _.sampleSize(defaultCharset, size) as string[]
    return samp.join('')
}
