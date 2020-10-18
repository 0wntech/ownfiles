import FileClient from './fileClient';
import { FileType, FolderType } from './read';

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
                                    type: file.type,
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
                        resolve({ url: folderUrl, type: 'folder' });
                    } else {
                        resolve(folderUrl);
                    }
                }),
            ]);
        })
        .catch(() =>
            options.verbose
                ? [{ url: folderUrl, type: 'folder' }]
                : [folderUrl],
        )
        .then(function(results: any[]) {
            return flattenArray(results)
                .sort((fileA: string, fileB: string) =>
                    sortByDepth(fileA, fileB, !!options.verbose),
                )
                .reverse();
        });

    return deepRead;
};

function flattenArray(array: any[]): string[] {
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

    return depthA - depthB;
}
