import { CreateOptions } from './create';
import url from 'url';
import FileClient from './fileClient';

import rdf = require('rdflib');
import ns = require('solid-namespace');
import { SingleFileType, FolderType } from './read';

export const copy = function(
    this: FileClient,
    resource: string,
    location: string,
) {
    return new Promise((resolve, reject) =>
        this.fetcher.load(location).then(async () => {
            if (
                this.graph.each(
                    rdf.sym(location),
                    ns(rdf).rdf('type'),
                    ns(rdf).ldp('Container'),
                    rdf.sym(location).doc(),
                ).length < 0
            ) {
                throw new Error('The specified Location is not a folder');
            } else {
                try {
                    if (resource.endsWith('/')) {
                        await this.copyFolder(resource, location);
                    } else {
                        await this.copyFile(resource, location);
                    }
                    resolve();
                } catch (err) {
                    reject(err);
                }
            }
        }),
    );
};

export const copyFile = function copyFile(
    this: FileClient,
    resource: string,
    location: string,
): Promise<Response> {
    return this.read(resource, { "verbose": true }).then(
        (file: string | FolderType | SingleFileType | Blob) => {
            file = file as SingleFileType;
            const fileName = resource.substr(resource.lastIndexOf('/') + 1);
            const options: CreateOptions = {
                "name": fileName,
                "contentType": file.contentType,
                "contents": file.body,
            };

            location = location.endsWith('/') ? location : location + '/';
            const newLocation = url.resolve(location, fileName);
            return this.create(newLocation, options).then((res) => {
                console.log(
                    `DEBUG -- Successfully copied ${resource} to ${location}`,
                );
                return res;
            });
        },
    );
};

export const copyFolder = function copyFolder(
    this: FileClient,
    resource: string,
    location: string,
): Promise<void> {
    location = location.endsWith('/') ? location : location + '/';
    return new Promise((resolve, reject) => {
        this.fetcher.load(resource).then(() => {
            const oldFolderNameFragments = resource.split('/');
            const oldFolderName =
                oldFolderNameFragments[oldFolderNameFragments.length - 2];
            const newFolderUrl = url.resolve(location, oldFolderName);
            this.create(newFolderUrl + '/').then((res: Response) => {
                const newFolderName =
                    res.headers.get('location') ??
                    newFolderUrl.substr(
                        newFolderUrl.lastIndexOf('/'),
                        newFolderUrl.length,
                    );
                console.log(
                    `DEBUG -- Successfully copied ${resource} to ${location}`,
                );
                const copies = this.graph
                    .each(rdf.sym(resource), ns(rdf).ldp('contains'))
                    .map((containment: { value: string }) => {
                        return this.copy(
                            containment.value,
                            url.resolve(location, newFolderName),
                        );
                    });
                Promise.all(copies)
                    .then(() => {
                        console.log(
                            `DEBUG -- Successfully copied ${resource}'s contents to ${location}`,
                        );
                        resolve();
                    })
                    .catch((err) => {
                        reject(err);
                    });
            });
        });
    });
};
