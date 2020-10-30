import * as rdf from 'rdflib';
import {
    create,
    createFile,
    createFolder,
    createIfNotExist,
    CreateOptions,
    ExtendedResponseType,
} from './create';
import {
    FileType,
    FolderType,
    read,
    ReadOptions,
    SingleFileType,
} from './read';
import { copy, copyFile, copyFolder } from './copy';
import { update } from './update';
import { renameFile, renameFolder } from './rename';
import * as deleting from './delete';
import { deepRead, IndexEntry } from './deepRead';
import {
    createIndex,
    readIndex,
    deleteIndex,
    addToIndex,
    deleteFromIndex,
    IndexType,
} from './indexing';

export default class FileClient {
    graph: rdf.IndexedFormula;
    fetcher: rdf.Fetcher;
    updater: rdf.UpdateManager;
    indexPath: string;
    indexURI?: string;
    create: (
        this: FileClient,
        resourceAddress: string,
        options?: Partial<CreateOptions>,
    ) => Promise<Response>;
    createFile: (
        this: FileClient,
        fileAddress: string,
        options: Partial<CreateOptions>,
    ) => Promise<Response>;
    createFolder: (
        this: FileClient,
        folderAddress: string,
        options?: Partial<CreateOptions>,
    ) => Promise<Response>;
    createIfNotExist: (
        this: FileClient,
        folderAddress: string,
        options?: Partial<CreateOptions> | undefined,
    ) => Promise<Response | undefined>;
    read: (
        this: FileClient,
        resource: string,
        options?: Partial<ReadOptions>,
    ) => Promise<FolderType | Blob | SingleFileType | FileType | string>;
    copy: (
        this: FileClient,
        resource: string,
        location: string,
    ) => Promise<unknown>;
    renameFile: (
        this: FileClient,
        resource: string,
        newName: string,
    ) => Promise<unknown>;
    renameFolder: (
        this: FileClient,
        resource: string,
        newName: string,
    ) => Promise<unknown>;
    delete: (
        this: FileClient,
        resources: string | string[],
    ) => Promise<ExtendedResponseType | ExtendedResponseType[]>;
    deleteRecursively: (
        this: FileClient,
        resource: string,
    ) => Promise<ExtendedResponseType>;
    update: (
        this: FileClient,
        resource: string,
        content: string,
        contentType?: string,
    ) => Promise<Response>;
    deepRead: (
        this: FileClient,
        folderUrl: string,
        options?: Partial<{
            auth: any;
            verbose: boolean;
            foundCallback: (item: string) => unknown;
        }>,
    ) => Promise<(IndexEntry | string)[]>;
    createIndex: (
        this: FileClient,
        user: string,
        options?: Partial<{
            items: IndexType;
            foundCallback: (item) => unknown;
        }>,
    ) => Promise<IndexType | undefined>;
    deleteIndex: (this: FileClient, user: string) => Promise<unknown>;
    readIndex: (
        this: FileClient,
        user: string,
    ) => Promise<IndexType | undefined>;
    addToIndex: (
        this: FileClient,
        item: IndexEntry | string,
        options?: {
            force?: boolean;
            updateCallback?: (
                uri: string | undefined | null,
                success: boolean,
                errorBody?: string,
                response?: Response | Error,
            ) => void;
        },
    ) => Promise<void>;
    deleteFromIndex: (this: FileClient, item: string) => Promise<void[]>;
    copyFile: (
        this: FileClient,
        resource: string,
        location: string,
    ) => Promise<Response>;
    copyFolder: (
        this: FileClient,
        resource: string,
        location: string,
    ) => Promise<void>;

    constructor(
        { indexPath }: { indexPath: string } = {
            indexPath: 'settings/fileIndex.ttl',
        },
    ) {
        this.graph = rdf.graph();
        this.fetcher = new rdf.Fetcher(this.graph);
        this.updater = new rdf.UpdateManager(this.graph);
        this.indexPath = indexPath;
        this.create = create;
        this.createFile = createFile;
        this.createFolder = createFolder;
        this.createIfNotExist = createIfNotExist;
        this.read = read;
        this.copy = copy;
        this.renameFile = renameFile;
        this.renameFolder = renameFolder;
        this.delete = deleting.deleteResource;
        this.deleteRecursively = deleting.deleteRecursively;
        this.update = update;
        this.deepRead = deepRead;
        this.createIndex = createIndex;
        this.deleteIndex = deleteIndex;
        this.readIndex = readIndex;
        this.addToIndex = addToIndex;
        this.deleteFromIndex = deleteFromIndex;
        this.copyFile = copyFile;
        this.copyFolder = copyFolder;
    }
}
