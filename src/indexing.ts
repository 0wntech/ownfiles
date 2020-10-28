import * as urlUtils from 'url';
import cuid from 'cuid';
import FileClient from './index';
import * as rdf from 'rdflib';
import { IndexEntry } from './deepRead';
const ns = require('solid-namespace')(rdf);

export type IndexType = IndexEntry[];

export const createIndex = async function(
    this: FileClient,
    url: string,
    items?: IndexType,
) {
    const parsedUrl = urlUtils.parse(url);
    const rootUrl = `${parsedUrl.protocol}//${parsedUrl.host}/`;
    const indexUrl = rootUrl + this.indexPath;
    await this.createIfNotExist(indexUrl);
    this.indexURI = indexUrl;
    items =
        (items as IndexEntry[]) ??
        ((await this.deepRead(url, { verbose: true })) as IndexEntry[]);

    const { ins } = getNewIndexTriples(items, this.graph, indexUrl);

    await this.updater.put(
        rdf.sym(indexUrl),
        ins,
        'text/turtle',
        (_, ok, error) => {
            if (!ok) throw error;
        },
    );
    return this.readIndex(indexUrl);
};

export const deleteIndex = async function(this: FileClient, url: string) {
    const parsedUrl = urlUtils.parse(url);
    const rootUrl = `${parsedUrl.protocol}//${parsedUrl.host}/`;
    const indexUrl = rootUrl + this.indexPath;
    return this.delete(indexUrl)
        .then(() => (this.indexURI = undefined))
        .catch((err) => {
            if (err.response.status === 404) {
                return;
            } else {
                throw err;
            }
        });
};

export const readIndex = function(this: FileClient, url: string) {
    const parsedUrl = urlUtils.parse(url);
    const rootUrl = `${parsedUrl.protocol}//${parsedUrl.host}/`;
    const indexUrl = rootUrl + this.indexPath;
    return this.fetcher.load(indexUrl).then(() => {
        const index = readIndexTriples(indexUrl, this.graph);
        return index;
    });
};

const readIndexTriples = (indexUrl: string, graph: any) => {
    const index: IndexEntry[] = [];
    graph
        .statementsMatching(
            null,
            ns.rdf('type'),
            ns.solid('TypeRegistration'),
            rdf.sym(indexUrl),
        )
        .forEach(({ subject }: { subject: { value: string } }) => {
            const instanceStatement = ((graph.any(
                subject,
                ns.solid('instance'),
            ) &&
                graph.statementsMatching(subject, ns.solid('instance'))) ??
                (graph.any(subject, ns.solid('instanceContainer')) &&
                    graph.statementsMatching(
                        subject,
                        ns.solid('instanceContainer'),
                    )))[0];
            const typeNodes = graph
                .statementsMatching(subject, ns.solid('forClass'))
                .map(
                    (statement: { object: { value: string } }) =>
                        statement.object.value,
                ) as string[];
            index.push(
                instanceStatement.predicate.value === ns.solid('instance')
                    ? {
                          url: instanceStatement.object.value,
                          types: typeNodes,
                      }
                    : {
                          url: instanceStatement.object.value,
                          types: typeNodes,
                      },
            );
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
    item: IndexEntry | string,
    {
        force,
        updateCallback,
    }: {
        force?: boolean;
        updateCallback?: (
            uri: string | undefined | null,
            success: boolean,
            errorBody?: string,
            response?: Response | Error,
        ) => void;
    } = {},
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
              })) as IndexEntry[])
            : ([item] as IndexEntry[]);
    if (!this.indexURI) {
        const res = await this.createIfNotExist(indexUrl);
        this.indexURI = res?.headers.get('Location') ?? indexUrl;
    }
    const index = !force ? ((await this.readIndex(rootUrl)) as IndexType) : [];
    const itemsToUpdate = index.reduce((itemsToUpdate: IndexEntry[], entry) => {
        const entryUrl = urlUtils.parse(entry.url);
        return parsedItemUrl.pathname?.includes(entryUrl.pathname as string)
            ? [...itemsToUpdate, entry]
            : itemsToUpdate;
    }, []);
    const { del, ins } = getNewIndexTriples(
        [...(itemsToUpdate ?? []), ...itemsToAdd],
        this.graph,
        indexUrl,
    );
    return await this.updater.update(
        del,
        ins,
        updateCallback ??
            ((_, ok, err) => {
                if (!ok) {
                    console.log(err);
                }
            }),
    );
};

const getNewIndexTriples = (
    items: IndexEntry[],
    graph: any,
    indexUrl: string,
) => {
    const del: rdf.Statement[] = [];
    const ins: rdf.Statement[] = [];

    items
        .filter((item) => item.url !== indexUrl)
        .forEach((item) => {
            if (item && item.types.includes(ns.ldp('Container').value)) {
                let rootNode = graph.any(
                    null,
                    ns.solid('instanceContainer'),
                    rdf.sym(item.url),
                );

                if (!rootNode) {
                    rootNode = new rdf.NamedNode(`${indexUrl}#${cuid()}`);
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
                    if (item.types.length === 0) {
                        graph
                            .statementsMatching(rootNode, ns.solid('forClass'))
                            .forEach((st) => del.push(st));
                    } else {
                        item.types.forEach((type) => {
                            ins.push(
                                rdf.st(
                                    rootNode,
                                    ns.solid('forClass'),
                                    rdf.sym(type),
                                    rdf.sym(indexUrl),
                                ),
                            );
                        });
                    }
                } else {
                    const typesFound = graph
                        .each(rootNode, ns.solid('forClass'), null)
                        .map((node: { value: string }) => node.value);
                    const typesToDelete = typesFound.reduce(
                        (notFoundTypes: string[], type: string) =>
                            !item.types.includes(type)
                                ? Array.isArray(notFoundTypes)
                                    ? [...notFoundTypes, type]
                                    : [type]
                                : notFoundTypes,
                        [],
                    );
                    const typesToAdd = item.types.reduce(
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
                                rdf.sym(type),
                                rdf.sym(indexUrl),
                            ),
                        ),
                    );
                }
            } else if (item && item.types.includes(ns.ldp('Resource').value)) {
                let rootNode = graph.any(
                    null,
                    ns.solid('instance'),
                    rdf.sym(item.url),
                );

                if (!rootNode) {
                    rootNode = new rdf.NamedNode(`${indexUrl}#${cuid()}`);
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
                            rdf.sym(item.url),
                            rdf.sym(indexUrl),
                        ),
                    );
                    item.types.forEach((type) => {
                        ins.push(
                            rdf.st(
                                rootNode,
                                ns.solid('forClass'),
                                rdf.sym(type),
                                rdf.sym(indexUrl),
                            ),
                        );
                    });
                } else {
                    const currentTypes = graph
                        .each(rootNode, ns.solid('forClass'), null)
                        .map((node) => node.value);
                    currentTypes.map((type) => {
                        if (!item.types.includes(type)) {
                            graph
                                .statementsMatching(
                                    rootNode,
                                    ns.solid('forClass'),
                                    rdf.sym(type),
                                )
                                .forEach((st) => {
                                    del.push(st);
                                });
                        }
                    });
                    item.types.forEach((type) => {
                        if (!currentTypes.includes(type)) {
                            ins.push(
                                rdf.st(
                                    rootNode,
                                    ns.solid('forClass'),
                                    rdf.sym(type),
                                    rdf.sym(indexUrl),
                                ),
                            );
                        }
                    });
                }
            }
        });
    return { del, ins };
};
