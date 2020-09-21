import FileClient from './fileClient';

import rdf = require('rdflib');
import ns = require('solid-namespace');

export const deleteResource = function(
    this: FileClient,
    resources: string | string[],
) {
    if (resources) {
        if (Array.isArray(resources)) {
            resources.map((item) => {
                return this.deleteRecursively(item);
            });
            return Promise.all(resources);
        } else {
            return this.deleteRecursively(resources);
        }
    } else {
        throw new Error(
            'Please specify the item/items you would like to delete.',
        );
    }
};

export const deleteRecursively = function(this: FileClient, resource: string) {
    const store = this.graph;
    const fetcher = this.fetcher;

    return new Promise((resolve, reject) => {
        fetcher
            .load(resource, { "force": true, "clearPreviousData": true })
            .then(() => {
                const files = store.each(
                    rdf.sym(resource),
                    ns(rdf).ldp('contains'),
                );
                const promises = files.map(
                    (file: { value: string; uri: string }) => {
                        if (
                            store.holds(
                                file,
                                ns(rdf).rdf('type'),
                                ns(rdf).ldp('BasicContainer'),
                            )
                        ) {
                            const fileFragments = file.uri.split('/');
                            const folderName =
                                fileFragments[fileFragments.length - 2];
                            if (resource.endsWith('/')) {
                                return this.deleteRecursively(
                                    resource + folderName + '/',
                                );
                            } else {
                                return this.deleteRecursively(
                                    resource + '/' + folderName + '/',
                                );
                            }
                        } else {
                            const fileFragments = file.uri.split('/');
                            const fileName =
                                fileFragments[fileFragments.length - 1];
                            return fetcher.webOperation(
                                'DELETE',
                                resource + fileName,
                            );
                        }
                    },
                );
                Promise.all(promises).then(() => {
                    fetcher
                        .webOperation('DELETE', resource)
                        .then((res: Response) => {
                            console.log(
                                `DEBUG -- Successfully deleted ${resource}`,
                            );
                            resolve(res);
                        })
                        .catch((err: Error) => {
                            reject(err);
                        });
                });
            })
            .catch((err: Error) => {
                console.log(err);
                fetcher
                    .webOperation('DELETE', resource)
                    .then((res: Response) => {
                        resolve(res);
                    })
                    .catch((err: Error) => {
                        reject(err);
                    });
            });
    });
};
