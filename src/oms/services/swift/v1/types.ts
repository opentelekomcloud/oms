import { Metadata } from '../../../core'

export interface Container {
    readonly count: number
    readonly bytes: number
    readonly name: string
    readonly last_modified?: string
}

export interface Account {
    readonly domainID: string
    readonly bytesUsed: number
    readonly objectCount: number
    readonly containerCount: number
    readonly metadata: Metadata
}

export interface AccountWithContainers extends Account{
    containers: Container[]
}
