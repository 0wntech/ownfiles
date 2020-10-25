import * as urlUtils from 'url';
import FileClient from './index';
import * as rdf from 'rdflib';
import { FileIndexEntry, FolderIndexEntry } from './deepRead';
const ns = require('solid-namespace')(rdf);
const typeNamespaceUrl = 'http://www.w3.org/ns/iana/media-types/';
const types = rdf.Namespace(typeNamespaceUrl);

export type IndexType = (FileIndexEntry | FolderIndexEntry)[];

export const createIndex = async function(
    this: FileClient,
    url: string,
    items?: IndexType,
) {
    const parsedUrl = urlUtils.parse(url);
    const rootUrl = `${parsedUrl.protocol}//${parsedUrl.host}/`;
    const indexUrl = rootUrl + this.indexPath;
    await this.createIfNotExist(indexUrl);
    items =
        (items as (FileIndexEntry | FolderIndexEntry)[]) ??
        ((await this.deepRead(url, { verbose: true })) as (
            | FileIndexEntry
            | FolderIndexEntry
        )[]);

    const [del, ins] = getNewIndexTriples(items, this.graph, indexUrl);

    await this.updater.update(del, ins);
    return this.readIndex(indexUrl);
};

export const deleteIndex = async function(this: FileClient, url: string) {
    const parsedUrl = urlUtils.parse(url);
    const rootUrl = `${parsedUrl.protocol}//${parsedUrl.host}/`;
    const indexUrl = rootUrl + this.indexPath;
    return this.delete(indexUrl).catch((err) => {
        if (err.response.status === 404) {
            return;
        } else {
            throw err;
        }
    });
};

export const readIndex = async function(this: FileClient, url: string) {
    const parsedUrl = urlUtils.parse(url);
    const rootUrl = `${parsedUrl.protocol}//${parsedUrl.host}/`;
    const indexUrl = rootUrl + this.indexPath;
    try {
        const res = (await this.read(indexUrl)) as string;
        rdf.parse(res, this.graph, indexUrl);
        return readIndexTriples(indexUrl, this.graph);
    } catch (err) {
        if (err?.status === 404) {
            return [];
        } else {
            throw err;
        }
    }
};

const readIndexTriples = (indexUrl: string, graph: any) => {
    if (!graph.any(null, null, null, rdf.sym(indexUrl))) {
        return;
    }
    const index: (FileIndexEntry | FolderIndexEntry)[] = [];
    graph
        .each(null, ns.rdf('type'), ns.solid('TypeRegistration'))
        .forEach((indexNode: { value: string }) => {
            const urlNode =
                graph.any(indexNode, ns.solid('instance')) ||
                graph.any(indexNode, ns.solid('instanceContainer'));
            const nodeTypes = graph
                .statementsMatching(indexNode, ns.solid('forClass'))
                .map((statement: { object: { value: string } }) =>
                    statement.object.value
                        .replace(typeNamespaceUrl, '')
                        .replace('#Resource', ''),
                ) as string[];
            index.push({ url: urlNode.value, types: nodeTypes });
        });

    return index;
};

export const deleteFromIndex = async function(this: FileClient, item: string) {
    const parsedUrl = urlUtils.parse(item);
    const rootUrl = `${parsedUrl.protocol}//${parsedUrl.host}/`;
    const indexUrl = rootUrl + this.indexPath;
    const itemsToDelete = await this.deepRead(item);
    await this.fetcher.load(indexUrl);
    if (item === indexUrl) return Promise.resolve([]);
    return await Promise.all(
        itemsToDelete.map((item) => {
            item = item as string;
            const rootNode = (this.graph.any(
                null,
                ns.solid('instance'),
                rdf.sym(item),
            ) ||
                this.graph.any(
                    null,
                    ns.solid('instanceContainer'),
                    rdf.sym(item),
                )) as rdf.Variable;
            return this.updater.update(
                this.graph.statementsMatching(rootNode),
                [],
                (_, ok, err) => {
                    if (!ok) {
                        console.log(err);
                    }
                },
            );
        }),
    );
};

export const addToIndex = async function(
    this: FileClient,
    item: FileIndexEntry | FolderIndexEntry | string,
    { force }: { force?: boolean } = {},
) {
    const parsedItemUrl =
        typeof item === 'string'
            ? urlUtils.parse(item)
            : urlUtils.parse(item.url);
    const rootUrl = `${parsedItemUrl.protocol}//${parsedItemUrl.host}/`;
    const indexUrl = rootUrl + this.indexPath;
    const itemsToAdd =
        !force && typeof item === 'string'
            ? ((await this.deepRead(item, {
                  verbose: true,
              })) as (FileIndexEntry | FolderIndexEntry)[])
            : ([item] as (FileIndexEntry | FolderIndexEntry)[]);
    await this.createIfNotExist(indexUrl);
    const index = (!force && (await this.readIndex(rootUrl))) as IndexType;
    const itemsToUpdate = index?.reduce(
        (itemsToUpdate: (FileIndexEntry | FolderIndexEntry)[], entry) => {
            const entryUrl = urlUtils.parse(entry.url);
            return parsedItemUrl.pathname?.includes(entryUrl.pathname as string)
                ? [...itemsToUpdate, entry]
                : itemsToUpdate;
        },
        [],
    );
    return await Promise.all(
        [...(itemsToUpdate ?? []), ...itemsToAdd].map((item) => {
            const [del, ins] = getNewIndexTriples([item], this.graph, indexUrl);
            return this.updater.update(del, ins, (_, ok, err) => {
                if (!ok) {
                    console.log(err);
                }
            });
        }),
    );
};

export const updateIndexFor = async function(this: FileClient, item: string) {
    await this.deleteFromIndex(item);
    await this.addToIndex(item);
};

const getNewIndexTriples = (
    items: (FolderIndexEntry | FileIndexEntry)[],
    graph: any,
    indexUrl: string,
) => {
    const del: rdf.Statement[] = [];
    const ins: rdf.Statement[] = [];

    items
        .filter((item) => item.url !== indexUrl)
        .forEach((item) => {
            const folderItem = item as FolderIndexEntry;
            const fileItem = item as FileIndexEntry;
            if (folderItem && folderItem.types) {
                let rootNode = graph.any(
                    null,
                    ns.solid('instanceContainer'),
                    rdf.sym(item.url),
                );

                if (!rootNode) {
                    rootNode = new rdf.BlankNode();
                    ins.push(
                        rdf.st(
                            rootNode,
                            ns.rdf('type'),
                            ns.solid('TypeRegistration'),
                            rdf.sym(indexUrl),
                        ),
                    );
                    ins.push(
                        rdf.st(
                            rootNode,
                            ns.solid('instanceContainer'),
                            rdf.sym(item.url),
                            rdf.sym(indexUrl),
                        ),
                    );
                    if (folderItem.types.length === 0) {
                        graph
                            .statementsMatching(rootNode, ns.solid('forClass'))
                            .forEach((st) => del.push(st));
                    } else {
                        folderItem.types.forEach((type) =>
                            ins.push(
                                rdf.st(
                                    rootNode,
                                    ns.solid('forClass'),
                                    types(type + '#Resource'),
                                    rdf.sym(indexUrl),
                                ),
                            ),
                        );
                    }
                } else {
                    const typesFound = graph
                        .each(rootNode, ns.solid('forClass'), null)
                        .map((node: { value: string }) => node.value);
                    const typesToDelete = typesFound.reduce(
                        (notFoundTypes: string[], type: string) =>
                            !folderItem.types.includes(type)
                                ? Array.isArray(notFoundTypes)
                                    ? [...notFoundTypes, type]
                                    : [type]
                                : notFoundTypes,
                        [],
                    );
                    const typesToAdd = folderItem.types.reduce(
                        (notFoundTypes: string[], type: string) =>
                            !typesFound.includes(type)
                                ? [...notFoundTypes, type]
                                : notFoundTypes,
                        [],
                    );
                    typesToDelete.forEach((type: string) =>
                        graph
                            .statementsMatching(
                                rootNode,
                                ns.solid('forClass'),
                                rdf.sym(type),
                            )
                            .forEach((st: rdf.Statement) => del.push(st)),
                    );
                    typesToAdd.forEach((type: string) =>
                        ins.push(
                            rdf.st(
                                rootNode,
                                ns.solid('forClass'),
                                types(type + '#Resource'),
                                rdf.sym(indexUrl),
                            ),
                        ),
                    );
                }
            } else if (fileItem && fileItem.type) {
                let rootNode = graph.any(
                    null,
                    ns.solid('instance'),
                    rdf.sym(fileItem.url),
                );

                if (!rootNode) {
                    rootNode = new rdf.BlankNode();
                    ins.push(
                        rdf.st(
                            rootNode,
                            ns.rdf('type'),
                            ns.solid('TypeRegistration'),
                            rdf.sym(indexUrl),
                        ),
                    );
                    ins.push(
                        rdf.st(
                            rootNode,
                            ns.solid('instance'),
                            rdf.sym(fileItem.url),
                            rdf.sym(indexUrl),
                        ),
                    );
                    ins.push(
                        rdf.st(
                            rootNode,
                            ns.solid('forClass'),
                            types(fileItem.type + '#Resource'),
                            rdf.sym(indexUrl),
                        ),
                    );
                } else {
                    const currentType = graph
                        .any(rootNode, ns.solid('forClass'), null)
                        .value.replace(typeNamespaceUrl, '')
                        .replace('#Resource', '');
                    if (currentType !== fileItem.type) {
                        graph
                            .statementsMatching(rootNode, ns.solid('forClass'))
                            .forEach((st: rdf.Statement) => del.push(st));
                        ins.push(
                            rdf.st(
                                rootNode,
                                ns.solid('forClass'),
                                types(fileItem.type + '#Resource'),
                                rdf.sym(indexUrl),
                            ),
                        );
                    }
                }
            }
        });
    return [del, ins];
};
