import sampleSize from 'lodash/sampleSize'

const defaultCharset = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('')

export function randomString(size: number): string {
    const samp = sampleSize(defaultCharset, size) as string[]
    return samp.join('')
}
