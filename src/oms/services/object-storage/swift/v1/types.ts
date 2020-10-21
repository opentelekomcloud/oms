import { Metadata, QueryParams } from '../../../../core'

export interface ContainerMetadata {
    readonly count: number
    readonly bytes: number
    readonly name: string
    readonly created?: number
    readonly metadata?: Metadata
    readonly last_modified?: string
}

export interface ObjectEntity {
    name: string
    hash: string
    bytes: number
    content_type: string
    last_modified: string
}

export interface Container extends ContainerMetadata {
    readonly objects: ObjectEntity[]
}

export interface AccountMetadata {
    readonly domainID: string
    readonly bytesUsed: number
    readonly objectCount: number
    readonly containerCount: number
    readonly metadata: Metadata
    readonly quota?: number
}

export interface Account extends AccountMetadata {
    containers: ContainerMetadata[]
}

export interface ObjectListOpts extends QueryParams {
    /**
     * Returns objects that have the specified prefix.
     */
    prefix: string
    /**
     * Returns the object names that are nested in the container.
     */
    delimiter: string
    /**
     * Returns the object names that are nested in the specified path.
     * Equivalent to setting delimiter to / and prefix to the path with a slash (/) at the end.
     */
    path: string
}
