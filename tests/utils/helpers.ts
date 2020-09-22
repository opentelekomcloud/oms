import _ from "underscore";

const defaultCharset = "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ".split('')

export function randomString(size: number): string {
    const samp = _.sample(defaultCharset, size) as string[]
    return samp.join('')
}
