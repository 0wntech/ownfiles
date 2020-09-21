import url from 'url';
import FileClient from './index';
import rdf = require('rdflib');
import ns = require('solid-namespace');
const typeNamespaceUrl = 'http://www.w3.org/ns/iana/media-types/';
const types = new rdf.Namespace(typeNamespaceUrl);

export const createIndex = async function(this: FileClient, user: string) {
    const userUrl = url.parse(user);
    const rootUrl = `${userUrl.protocol}//${userUrl.host}/`;
    const indexUrl = rootUrl + 'settings/fileIndex.ttl';
    await this.createIfNotExist(indexUrl);
    await this.readIndex(indexUrl);
    const items = (await this.deepRead(rootUrl, { "verbose": true })) as {
        url: string;
        type: string;
    }[];
    const [del, ins] = getNewIndexTriples(items, this.graph, indexUrl);

    await this.updater.update(del, ins);
    return this.readIndex(indexUrl);
};

export const deleteIndex = async function(this: FileClient, user: string) {
    const userUrl = url.parse(user);
    const rootUrl = `${userUrl.protocol}//${userUrl.host}/`;
    const indexUrl = rootUrl + 'settings/fileIndex.ttl';
    return this.delete(indexUrl);
};

export const readIndex = function(this: FileClient, user: string) {
    const userUrl = url.parse(user);
    const rootUrl = `${userUrl.protocol}//${userUrl.host}/`;
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
    const index: { url: string; types: string }[] = [];
    graph
        .each(null, ns(rdf).rdf('type'), ns(rdf).solid('TypeRegistration'))
        .forEach((indexNode: { value: string }) => {
            const urlNode =
                graph.any(indexNode, ns(rdf).solid('instance')) ||
                graph.any(indexNode, ns(rdf).solid('instanceContainer'));
            const nodeTypes = graph
                .statementsMatching(indexNode, ns(rdf).solid('forClass'))
                .map((statement: { object: { value: string } }) =>
                    statement.object.value
                        .replace(typeNamespaceUrl, '')
                        .replace('#Resource', ''),
                );
            index.push({ "url": urlNode.value, "types": nodeTypes });
        });

    return index;
};

const getNewIndexTriples = (
    items: { url: string; type: string }[],
    graph: any,
    indexUrl: string,
) => {
    const statement = rdf.st();
    const del: typeof statement[] = [];
    const ins: typeof statement[] = [];
    items.forEach((item) => {
        if (item.type === 'folder') {
            let rootNode = graph.any(
                null,
                ns(rdf).solid('instanceContainer'),
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
                                  types(currentItem.type + '#Resource'),
                              ]
                            : allTypes,
                    [],
                )
                .filter(
                    (currentType: string, index, allNodes: string[]) =>
                        allNodes.findIndex(
                            (type: string) => currentType === type,
                        ) === index,
                );

            if (!rootNode) {
                rootNode = new rdf.BlankNode();
                ins.push(
                    rdf.st(
                        rootNode,
                        ns(rdf).rdf('type'),
                        ns(rdf).solid('TypeRegistration'),
                        rdf.sym(indexUrl),
                    ),
                );
                ins.push(
                    rdf.st(
                        rootNode,
                        ns(rdf).solid('instanceContainer'),
                        rdf.sym(item.url),
                        rdf.sym(indexUrl),
                    ),
                );
                containedTypes.forEach((type) =>
                    ins.push(
                        rdf.st(
                            rootNode,
                            ns(rdf).solid('forClass'),
                            type,
                            rdf.sym(indexUrl),
                        ),
                    ),
                );
            } else {
                const typesFound = graph
                    .each(rootNode, ns(rdf).solid('forClass'), null)
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
                            ns(rdf).solid('forClass'),
                            rdf.sym(type),
                        )
                        .forEach((st: typeof statement) => del.push(st)),
                );
                typesToAdd.forEach((type: string) =>
                    ins.push(
                        rdf.st(
                            rootNode,
                            ns(rdf).solid('forClass'),
                            type,
                            rdf.sym(indexUrl),
                        ),
                    ),
                );
            }
        } else {
            let rootNode = graph.any(
                null,
                ns(rdf).solid('instance'),
                rdf.sym(item.url),
            );

            if (!rootNode) {
                rootNode = new rdf.BlankNode();
                ins.push(
                    rdf.st(
                        rootNode,
                        ns(rdf).rdf('type'),
                        ns(rdf).solid('TypeRegistration'),
                        rdf.sym(indexUrl),
                    ),
                );
                ins.push(
                    rdf.st(
                        rootNode,
                        ns(rdf).solid('instance'),
                        rdf.sym(item.url),
                        rdf.sym(indexUrl),
                    ),
                );
                ins.push(
                    rdf.st(
                        rootNode,
                        ns(rdf).solid('forClass'),
                        types(item.type + '#Resource'),
                        rdf.sym(indexUrl),
                    ),
                );
            } else {
                const currentType = graph
                    .any(rootNode, ns(rdf).solid('forClass'), null)
                    .value.replace(types(), '')
                    .replace('#Resource', '');
                if (currentType !== item.type) {
                    graph
                        .statementsMatching(rootNode, ns(rdf).solid('forClass'))
                        .forEach((st: typeof statement) => del.push(st));
                    ins.push(
                        rdf.st(
                            rootNode,
                            ns(rdf).solid('forClass'),
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
