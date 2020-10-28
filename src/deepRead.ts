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
    options: Partial<{ auth: any; verbose: boolean }> = {
        auth: null,
        verbose: false,
    },
) {
    const deepRead = await this.read(folderUrl, {
        verbose: true,
        headOnly: true,
        headers: { Accept: 'text/turtle' },
    })
        .then((folder) => {
            folder = folder as FolderType;
            const folderList = folder.folders.map((folder: string) =>
                Promise.resolve(this.deepRead(folder, options)),
            );
            const fileList = folder.files.map(
                (file: FileType | string) =>
                    new Promise(function(resolve) {
                        if (typeof file !== 'string') {
                            if (options.verbose) {
                                resolve({
                                    url: file.name,
                                    type: types(file.type + '#Resource').value,
                                });
                            } else {
                                resolve(file.name);
                            }
                        } else {
                            resolve(file);
                        }
                    }),
            );
            return Promise.all([
                ...folderList,
                ...fileList,
                new Promise(function(resolve) {
                    if (options.verbose) {
                        resolve([
                            {
                                url: folderUrl.endsWith('/')
                                    ? folderUrl
                                    : folderUrl + '/',
                                type: 'folder',
                            },
                        ]);
                    } else {
                        resolve([
                            folderUrl.endsWith('/')
                                ? folderUrl
                                : folderUrl + '/',
                        ]);
                    }
                }),
            ]);
        })
        .catch(() => {
            return options.verbose
                ? [
                      {
                          url: folderUrl,
                          type: mime.getType(folderUrl),
                      },
                  ]
                : [folderUrl];
        })
        .then((results): ({ url: string; type: string } | string)[] => {
            return flattenArray(results)
                .sort((fileA: string, fileB: string) =>
                    sortByDepth(fileA, fileB, !!options.verbose),
                )
                .reverse();
        });

    if (options.verbose) {
        const verboseDeepRead = (deepRead as {
            url: string;
            type: string;
        }[]).map((resource, _, deepRead) => {
            return resource.type && resource.type === 'folder'
                ? {
                      url: resource.url,
                      types: [
                          ...getContainedTypes(resource, deepRead),
                          ns().ldp('Container'),
                      ],
                  }
                : {
                      url: resource.url,
                      types: [resource.type, ns().ldp('Resource')],
                  };
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
