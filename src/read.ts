import url from 'url';
import mime from 'mime';
import FileClient from './fileClient';
import * as rdf from 'rdflib';
import ns from 'solid-namespace';

export interface ReadOptions {
    auth: any;
    verbose: boolean;
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
    options: Partial<ReadOptions> = {
        auth: false,
        verbose: false,
        headers: {
            Accept: mime.getType(resource) ?? 'text/turtle',
        },
    },
) {
    const store = this.graph;
    const fetcher = this.fetcher;

    store.removeDocument(rdf.sym(resource));
    let response;

    if (options.auth) {
        response = await options.auth.fetch(resource, {
            headers: options.headers,
        });
    } else {
        response = await fetcher._fetch(resource, {
            headers: options.headers,
        });
    }
    const contentType = response.headers.get('Content-Type');
    if (
        contentType.includes('text') ||
        (contentType.includes('application') &&
            contentType !== 'application/octet-stream')
    ) {
        const text = await response.text();
        if (
            response.headers.get('Content-Type') === 'text/turtle' &&
            isFolder(text, resource, store)
        ) {
            return parseResult(resource, store, options.verbose);
        } else {
            if (options.verbose) {
                return { body: text, contentType: contentType };
            } else {
                return text;
            }
        }
    } else {
        const body = response.blob
            ? await response.blob()
            : await response.buffer();
        if (options.verbose) {
            return { body: body, contentType: contentType };
        } else {
            return body;
        }
    }
};

const isFolder = (result: string, resource: string, store: any) => {
    try {
        if (result) {
            rdf.parse(result, store, resource, 'text/turtle');
        }
        return store.holds(
            rdf.sym(resource),
            ns(rdf).rdf('type'),
            ns(rdf).ldp('BasicContainer'),
        );
    } catch (err) {
        return false;
    }
};

const parseResult = (resource: string, store: any, verbose = false) => {
    const containments: FolderType = { folders: [], files: [] };
    store
        .each(rdf.sym(resource), ns(rdf).ldp('contains'), undefined)
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
                containments.folders.push(result);
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
