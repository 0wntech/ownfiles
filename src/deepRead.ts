import ns from 'solid-namespace';
import mime from 'mime';
import * as rdf from 'rdflib';

import FileClient from './fileClient';
import { FileType, FolderType } from './read';

const typeNamespaceUrl = 'http://www.w3.org/ns/iana/media-types/';
const types = rdf.Namespace(typeNamespaceUrl);
export interface IndexEntry {
    url: string;
    types: string[];
}

export const deepRead = async function(
    this: FileClient,
    folderUrl: string,
    options: Partial<{
        auth: any;
        verbose: boolean;
        foundCallback: (item: string) => unknown;
    }> = {
        auth: null,
        verbose: false,
    },
) {
    const deepRead = await this.read(folderUrl, {
        verbose: true,
        headOnly: true,
        headers: { Accept: 'text/turtle' },
    })
        .catch((err) => {
            if (
                err?.response?.url &&
                err.response.status !== 404 &&
                mime.getType(folderUrl)
            ) {
                return Promise.resolve(
                    options.verbose
                        ? [
                              {
                                  name: err.response.url,
                                  type: mime.getType(err.response.url),
                              },
                          ]
                        : err.response.url,
                );
            }
            if (err?.response?.url && err.response.status !== 404)
                return Promise.resolve({ files: [], folders: [] });
        })
        .then((folder) => {
            const file = folder as FileType;
            folder = folder as FolderType;
            if (file?.name && file.type) {
                return Promise.resolve(
                    options.verbose
                        ? [
                              {
                                  url: file.name,
                                  type: types(file.type + '#Resource').value,
                              },
                          ]
                        : [file.name],
                );
            } else if (folder?.files && folder.folders) {
                const folderList = folder.folders.map((folder: string) =>
                    this.deepRead(folder, options),
                );
                const fileList = folder.files.map(
                    (file) =>
                        new Promise(function(resolve) {
                            if (options.verbose) {
                                options.foundCallback &&
                                    options.foundCallback(
                                        (file as FileType).name,
                                    );
                                resolve({
                                    url: (file as FileType).name,
                                    type: types(
                                        (file as FileType).type + '#Resource',
                                    ).value,
                                });
                            } else {
                                options.foundCallback &&
                                    options.foundCallback(
                                        (file as FileType).name,
                                    );
                                resolve((file as FileType).name);
                            }
                        }),
                );
                return Promise.all([
                    ...folderList,
                    ...fileList,
                    new Promise(function(resolve) {
                        if (options.verbose) {
                            options.foundCallback &&
                                options.foundCallback(folderUrl);
                            resolve([
                                {
                                    url: folderUrl.endsWith('/')
                                        ? folderUrl
                                        : folderUrl + '/',
                                    type: 'folder',
                                },
                            ]);
                        } else {
                            options.foundCallback &&
                                options.foundCallback(folderUrl);
                            resolve([
                                folderUrl.endsWith('/')
                                    ? folderUrl
                                    : folderUrl + '/',
                            ]);
                        }
                    }),
                ]);
            }

            return Promise.resolve([]);
        })
        .then((results): (
            | FileType
            | FolderType
            | { url: string; type: string }
            | { url: string; types: string[] }
            | string
        )[] => {
            return flattenArray(results)
                .sort((fileA: string, fileB: string) =>
                    sortByDepth(fileA, fileB, !!options.verbose),
                )
                .reverse();
        });

    if (options.verbose) {
        const verboseDeepRead = deepRead.map((resource, _, deepRead) => {
            const previousIndexResource = resource as {
                url: string;
                types: string[];
            };
            const unseenResource = resource as { url: string; type: string };
            if (previousIndexResource.types) return resource;
            if (unseenResource?.type) {
                return unseenResource.type === 'folder'
                    ? {
                          url: unseenResource.url,
                          types: [
                              ns().ldp('Container'),
                              ...getContainedTypes(unseenResource, deepRead),
                          ],
                      }
                    : {
                          url: unseenResource.url,
                          types: [unseenResource.type, ns().ldp('Resource')],
                      };
            }
        });

        return verboseDeepRead as IndexEntry[];
    }

    return deepRead as string[];
};

const getContainedTypes = (item, index) => {
    return index
        .reduce(
            (
                allTypes: string[],
                currentItem: { url: string; type: string },
            ) => {
                return currentItem.url.includes(item.url) &&
                    currentItem.type &&
                    currentItem.type !== null &&
                    currentItem.type !== 'folder'
                    ? [...allTypes, currentItem.type]
                    : allTypes;
            },
            [],
        )
        .filter(
            (currentType: string, index: number, allNodes: string[]) =>
                allNodes.findIndex((type: string) => currentType === type) ===
                index,
        );
};

function flattenArray(array): string[] {
    let result: string[] = [];
    for (let i = 0; i < array.length; i++) {
        const element = array[i];
        if (Array.isArray(element)) {
            result = [...result, ...flattenArray(element)];
        } else {
            result = [...result, element];
        }
    }
    return result;
}

function sortByDepth(
    fileA: string | { url: string },
    fileB: string | { url: string },
    verbose: boolean,
) {
    if (verbose && typeof fileA !== 'string' && typeof fileB !== 'string') {
        fileA = fileA.url;
        fileB = fileB.url;
    }
    let depthA = 0;
    let depthB = 0;
    if (typeof fileA === 'string' && typeof fileB === 'string') {
        depthA = fileA.split('/').length;
        depthB = fileB.split('/').length;
    }

    if (depthA === depthB) {
        return (fileA as string).length - (fileB as string).length;
    } else {
        return depthA - depthB;
    }
}
