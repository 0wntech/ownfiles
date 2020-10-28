import url from 'url';
import mime from 'mime';
import FileClient from './fileClient';
import * as rdf from 'rdflib';
import ns from 'solid-namespace';

export interface ReadOptions {
    auth: any;
    verbose: boolean;
    headOnly: boolean;
    headers: Record<string, string>;
}

export interface FolderType {
    folders: string[];
    files: (FileType | string)[];
}

export interface FileType {
    name: string;
    type: string;
}

export interface SingleFileType {
    body: string;
    contentType: string;
}

export const read = async function(
    this: FileClient,
    resource: string,
    { auth, verbose, headOnly, headers }: Partial<ReadOptions> = {
        auth: false,
        verbose: false,
        headOnly: false,
        headers: {
            Accept: mime.getType(resource) ?? 'text/turtle',
        },
    },
) {
    const store = this.graph;
    const fetcher = this.fetcher;
    store.removeDocument(rdf.sym(resource));

    let fetch;
    if (auth) {
        fetch = auth.fetch;
    } else {
        fetch = fetcher._fetch;
    }
    const headResponse = await fetch(resource, {
        method: 'HEAD',
    });
    const isFolder =
        headResponse &&
        headResponse.headers
            .get('Link')
            ?.includes('http://www.w3.org/ns/ldp#Container');
    if (!isFolder && headOnly) {
        return Promise.resolve(
            verbose
                ? {
                      name: resource,
                      type: headResponse.headers.get('Content-Type'),
                  }
                : resource,
        );
    }
    resource = isFolder
        ? resource.endsWith('/')
            ? resource
            : resource + '/'
        : resource;

    const response = await fetch(resource, {
        headers: headers,
    }).catch((err) => {
        throw err;
    });

    const contentType = response.headers.get('Content-Type');
    if (
        contentType.includes('text') ||
        (contentType.includes('application') &&
            contentType !== 'application/octet-stream')
    ) {
        const text = await response.text();
        if (
            response.headers.get('Content-Type') === 'text/turtle' &&
            isFolder
        ) {
            rdf.parse(text, store, resource);
            return getFolderResult(resource, store, verbose);
        } else {
            if (verbose) {
                return { body: text, contentType: contentType };
            } else {
                return text;
            }
        }
    } else {
        const body = response.blob
            ? await response.blob()
            : await response.buffer();
        if (verbose) {
            return { body: body, contentType: contentType };
        } else {
            return body;
        }
    }
};

export const getFolderResult = (
    resource: string,
    store: any,
    verbose = false,
) => {
    const containments: FolderType = { folders: [], files: [] };
    store
        .each(rdf.sym(resource), ns(rdf).ldp('contains'), null)
        .map((result: { value: string }) => {
            return result.value;
        })
        .forEach((result: string) => {
            const type = store.statementsMatching(
                rdf.sym(result),
                ns(rdf).rdf('type'),
            )[0].object;
            const isLinked = ((type) =>
                type.value ===
                'http://www.w3.org/ns/iana/media-types/text/turtle#Resource')(
                type,
            );
            let resultFragments = url.parse(result).pathname?.split('/');
            if (resultFragments && resultFragments[1] === '') {
                resultFragments.shift();
                const path =
                    url.parse(result).pathname ??
                    result.substr(
                        result.replace('https://', '').indexOf('/'),
                        result.length,
                    );
                result = result.replace(path, resultFragments.join('/'));
                resultFragments = path.split('/');
            }
            if (
                resultFragments &&
                resultFragments[resultFragments.length - 1] === ''
            ) {
                containments.folders.push(
                    result.endsWith('/') ? result : result + '/',
                );
            } else {
                if (verbose) {
                    containments.files.push({
                        name: result,
                        type: !isLinked
                            ? mime.getType(result) ?? 'text/plain'
                            : 'text/turtle',
                    });
                } else {
                    containments.files.push(result);
                }
            }
        });
    return containments;
};
