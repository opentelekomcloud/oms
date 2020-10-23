import sampleSize from 'lodash/sampleSize'
import { MockResponseInit } from 'jest-fetch-mock'

const defaultCharset = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('')

export function randomString(size: number): string {
    const samp = sampleSize(defaultCharset, size) as string[]
    return samp.join('')
}

export function json(body = ''): MockResponseInit {
    return {
        body: body,
        // eslint-disable-next-line @typescript-eslint/naming-convention
        init: { headers: { 'Content-Type': 'application/json' } },
    }
}
