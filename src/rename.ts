import mime from 'mime';
import url from 'url';

import * as rdf from 'rdflib';
import ns from 'solid-namespace';

import { CreateOptions } from './create';
import FileClient from './fileClient';

export const renameFolder = function(
    this: FileClient,
    resource: string,
    newName: string,
) {
    return new Promise((resolve, reject) => {
        this.fetcher.load(resource).then(() => {
            const oldFolderName = resource.split('/');
            if (resource.endsWith('/')) {
                oldFolderName.pop();
                oldFolderName.pop();
            } else {
                oldFolderName.pop();
            }
            const newFolderLocation = oldFolderName.join('/');
            oldFolderName.push(newName);
            const newFolderUrl = oldFolderName.join('/');
            this.create(newFolderUrl + '/').then((res: Response) => {
                const newFolderName =
                    res.headers.get('location') ?? newFolderUrl + '/';
                console.log(
                    `DEBUG -- Successfully copied ${resource} to ${newFolderName}`,
                );
                const copies = this.graph
                    .each(rdf.sym(resource), ns(rdf).ldp('contains'))
                    .map((containment: { value: string }) => {
                        return this.copy(
                            containment.value,
                            url.resolve(newFolderLocation, newFolderName),
                        );
                    });
                Promise.all(copies)
                    .then(() => {
                        this.delete(resource)
                            .then(() => {
                                console.log(
                                    `DEBUG -- Successfully rename ${resource} to ${newName}`,
                                );
                                resolve();
                            })
                            .catch((err: Error) => {
                                reject(err);
                            });
                    })
                    .catch((err) => {
                        reject(err);
                    });
            });
        });
    });
};

export const renameFile = function(
    this: FileClient,
    resource: string,
    newName: string,
) {
    return this.read(resource).then((content) => {
        const stringContent = content as string;
        const blobContent = content as Blob;
        const options: CreateOptions = {
            "name": newName,
            "contents": stringContent ?? blobContent ?? '',
            "contentType":
                mime.getType(newName) ||
                mime.getType(resource) ||
                'text/turtle',
        };

        let location = '';
        if (resource.endsWith('/')) {
            const resourceFragments = resource.split('/');
            resourceFragments.pop();
            resourceFragments.pop();
            location = resourceFragments.join('/');
        } else {
            const resourceFragments = resource.split('/');
            resourceFragments.pop();
            location = resourceFragments.join('/');
        }

        const newLocation = url.resolve(location, newName);
        return this.create(newLocation, options).then(() => {
            console.log(
                `DEBUG -- Successfully renamed ${resource} to ${newName}`,
            );
            return this.delete(resource);
        });
    });
};
