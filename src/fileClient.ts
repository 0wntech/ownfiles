import * as rdf from 'rdflib';
import {
    create,
    createFile,
    createFolder,
    createIfNotExist,
    CreateOptions,
} from './create';
import { FolderType, read, ReadOptions, SingleFileType } from './read';
import { copy, copyFile, copyFolder } from './copy';
import { update } from './update';
import { renameFile, renameFolder } from './rename';
import * as deleting from './delete';
import { deepRead } from './deepRead';
import { createIndex, readIndex, deleteIndex } from './indexing';

export default class FileClient {
    graph: any;
    fetcher: any;
    updater: any;
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
    ) => Promise<Response> | void;
    read: (
        this: FileClient,
        resource: string,
        options?: Partial<ReadOptions>,
    ) => Promise<FolderType | Blob | SingleFileType | string>;
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
    ) => Promise<unknown>;
    deleteRecursively: (this: FileClient, resource: string) => Promise<unknown>;
    update: (
        this: FileClient,
        resource: string,
        content: string,
        contentType?: string,
    ) => Promise<Response>;
    deepRead: (
        this: FileClient,
        folderUrl: string,
        options?: Partial<{ auth: any; verbose: boolean }>,
    ) => Promise<({ url: string; type: string } | string)[]>;
    createIndex: (
        this: FileClient,
        user: string,
    ) => Promise<{ url: string; types: string[] }[] | undefined>;
    deleteIndex: (this: FileClient, user: string) => Promise<unknown>;
    readIndex: (
        this: FileClient,
        user: string,
    ) => Promise<{ url: string; types: string[] }[] | undefined>;
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

    constructor() {
        this.graph = rdf.graph();
        this.fetcher = new rdf.Fetcher(this.graph);
        this.updater = new rdf.UpdateManager(this.graph);
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
        this.copyFile = copyFile;
        this.copyFolder = copyFolder;
    }
}
