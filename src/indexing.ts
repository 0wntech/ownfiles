import * as urlUtils from 'url';
import FileClient from './index';
import * as rdf from 'rdflib';
const ns = require('solid-namespace')(rdf);
const typeNamespaceUrl = 'http://www.w3.org/ns/iana/media-types/';
const types = rdf.Namespace(typeNamespaceUrl);

export interface IndexType {
    url: string;
    types: string[];
}

export const createIndex = async function(this: FileClient, url: string) {
    const parsedUrl = urlUtils.parse(url);
    const rootUrl = `${parsedUrl.protocol}//${parsedUrl.host}/`;
    const indexUrl = rootUrl + 'settings/fileIndex.ttl';
    await this.createIfNotExist(indexUrl);
    await this.readIndex(indexUrl);
    const items = (await this.deepRead(rootUrl, { verbose: true })) as {
        url: string;
        type: string;
    }[];
    const [del, ins] = getNewIndexTriples(items, this.graph, indexUrl);

    await this.updater.update(del, ins);
    return this.readIndex(indexUrl);
};

export const deleteIndex = async function(this: FileClient, url: string) {
    const parsedUrl = urlUtils.parse(url);
    const rootUrl = `${parsedUrl.protocol}//${parsedUrl.host}/`;
    const indexUrl = rootUrl + 'settings/fileIndex.ttl';
    return this.delete(indexUrl);
};

export const readIndex = function(this: FileClient, url: string) {
    const parsedUrl = urlUtils.parse(url);
    const rootUrl = `${parsedUrl.protocol}//${parsedUrl.host}/`;
    const indexUrl = rootUrl + 'settings/fileIndex.ttl';
    return this.fetcher.load(indexUrl).then((res: Response) => {
        if (res.status !== 200) {
            return undefined;
        } else {
            return readIndexTriples(indexUrl, this.graph);
        }
    });
};

const readIndexTriples = (indexUrl: string, graph: any) => {
    if (!graph.any(null, null, null, rdf.sym(indexUrl))) {
        return;
    }
    const index: IndexType[] = [];
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
    const indexUrl = rootUrl + 'settings/fileIndex.ttl';
    const itemsToDelete = await this.deepRead(item);
    await this.fetcher.load(indexUrl);
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
            );
        }),
    );
};

export const addToIndex = async function(this: FileClient, item: string) {
    const parsedUrl = urlUtils.parse(item);
    const rootUrl = `${parsedUrl.protocol}//${parsedUrl.host}/`;
    const indexUrl = rootUrl + 'settings/fileIndex.ttl';
    const itemsToAdd = (await this.deepRead(item, {
        verbose: true,
    })) as { url: string; type: string }[];
    await this.fetcher.load(indexUrl);
    return await Promise.all(
        itemsToAdd.map((item) => {
            const [del, ins] = getNewIndexTriples([item], this.graph, indexUrl);
            return this.updater.update(del, ins);
        }),
    );
};

export const updateIndexFor = async function(this: FileClient, item: string) {
    await this.deleteFromIndex(item);
    await this.addToIndex(item);
};

const getNewIndexTriples = (
    items: { url: string; type: string }[],
    graph: any,
    indexUrl: string,
) => {
    const del: rdf.Statement[] = [];
    const ins: rdf.Statement[] = [];
    items.forEach((item) => {
        if (item.type === 'folder') {
            let rootNode = graph.any(
                null,
                ns.solid('instanceContainer'),
                rdf.sym(item.url),
            );

            const containedTypes: string[] = items
                .reduce(
                    (
                        allTypes: string[],
                        currentItem: { url: string; type: string },
                    ) =>
                        currentItem.url.includes(item.url) &&
                        currentItem.type &&
                        currentItem.type !== null &&
                        currentItem.type !== 'folder'
                            ? [
                                  ...allTypes,
                                  types(currentItem.type + '#Resource').value,
                              ]
                            : allTypes,
                    [],
                )
                .filter(
                    (currentType: string, index: number, allNodes: string[]) =>
                        allNodes.findIndex(
                            (type: string) => currentType === type,
                        ) === index,
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
                containedTypes.forEach((type) =>
                    ins.push(
                        rdf.st(
                            rootNode,
                            ns.solid('forClass'),
                            rdf.sym(type),
                            rdf.sym(indexUrl),
                        ),
                    ),
                );
            } else {
                const typesFound = graph
                    .each(rootNode, ns.solid('forClass'), null)
                    .map((node: { value: string }) => node.value);
                const typesToDelete = typesFound.reduce(
                    (notFoundTypes: string[], type: string) =>
                        !containedTypes.includes(type)
                            ? Array.isArray(notFoundTypes)
                                ? [...notFoundTypes, type]
                                : [type]
                            : notFoundTypes,
                    [],
                );
                const typesToAdd = containedTypes.reduce(
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
        } else {
            let rootNode = graph.any(
                null,
                ns.solid('instance'),
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
                        ns.solid('instance'),
                        rdf.sym(item.url),
                        rdf.sym(indexUrl),
                    ),
                );
                ins.push(
                    rdf.st(
                        rootNode,
                        ns.solid('forClass'),
                        types(item.type + '#Resource'),
                        rdf.sym(indexUrl),
                    ),
                );
            } else {
                const currentType = graph
                    .any(rootNode, ns.solid('forClass'), null)
                    .value.replace(typeNamespaceUrl, '')
                    .replace('#Resource', '');
                if (currentType !== item.type) {
                    graph
                        .statementsMatching(rootNode, ns.solid('forClass'))
                        .forEach((st: rdf.Statement) => del.push(st));
                    ins.push(
                        rdf.st(
                            rootNode,
                            ns.solid('forClass'),
                            types(item.type + '#Resource'),
                            rdf.sym(indexUrl),
                        ),
                    );
                }
            }
        }
    });
    return [del, ins];
};
