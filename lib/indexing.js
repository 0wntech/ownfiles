const url = require('url');
const rdf = require('rdflib');
const ns = require('solid-namespace')(rdf);
const typeNamespaceUrl = 'http://www.w3.org/ns/iana/media-types/';
const types = new rdf.Namespace(typeNamespaceUrl);

module.exports.createIndex = function(user) {
    const userUrl = url.parse(user);
    const rootUrl = `${userUrl.protocol}//${userUrl.host}/`;
    const indexUrl = rootUrl + 'settings/fileIndex.ttl';
    return this.createIfNotExist(indexUrl).then(() => {
        return this.readIndex(indexUrl).then(() =>
            this.deepRead(rootUrl, { verbose: true }).then(async (items) => {
                const [del, ins] = getNewIndexTriples(
                    items,
                    this.graph,
                    indexUrl
                );

                await this.updater.update(del, ins);
                return this.readIndex(indexUrl);
            })
        );
    });
};

module.exports.readIndex = function(indexUrl) {
    return this.fetcher.load(indexUrl).then((res) => {
        if (res.status !== 200) {
            return undefined;
        } else {
            return readIndexTriples(indexUrl, this.graph);
        }
    });
};

const readIndexTriples = (indexUrl, graph) => {
    if (!graph.any(null, null, null, rdf.sym(indexUrl))) {
        return;
    }
    const index = [];
    graph
        .each(null, ns.rdf('type'), ns.solid('TypeRegistration'))
        .forEach((indexNode) => {
            const urlNode =
                graph.any(indexNode, ns.solid('instance')) ||
                graph.any(indexNode, ns.solid('instanceContainer'));
            const nodeTypes = graph
                .statementsMatching(indexNode, ns.solid('forClass'))
                .map((statement) =>
                    statement.object.value
                        .replace(typeNamespaceUrl, '')
                        .replace('#Resource', '')
                );
            index.push({ url: urlNode.value, types: nodeTypes });
        });

    return index;
};

const getNewIndexTriples = (items, graph, indexUrl) => {
    const del = [];
    const ins = [];
    items.forEach((item) => {
        if (item.type === 'folder') {
            let rootNode = graph.any(
                null,
                ns.solid('instanceContainer'),
                rdf.sym(item.url)
            );

            const containedTypes = items
                .reduce(
                    (allTypes, currentItem) =>
                        currentItem.url.includes(item.url) &&
                        currentItem.type &&
                        currentItem.type !== null &&
                        currentItem.type !== 'folder'
                            ? [
                                  ...allTypes,
                                  types(currentItem.type + '#Resource'),
                              ]
                            : allTypes,
                    []
                )
                .reduce(
                    (uniqueNodes, currentNode, index, allNodes) =>
                        allNodes.findIndex(
                            (node) => currentNode.value === node.value
                        ) === index
                            ? [...uniqueNodes, currentNode]
                            : uniqueNodes,
                    []
                );

            if (!rootNode) {
                rootNode = new rdf.BlankNode();
                ins.push(
                    rdf.st(
                        rootNode,
                        ns.rdf('type'),
                        ns.solid('TypeRegistration'),
                        rdf.sym(indexUrl)
                    )
                );
                ins.push(
                    rdf.st(
                        rootNode,
                        ns.solid('instanceContainer'),
                        rdf.sym(item.url),
                        rdf.sym(indexUrl)
                    )
                );
                containedTypes.forEach((type) =>
                    ins.push(
                        rdf.st(
                            rootNode,
                            ns.solid('forClass'),
                            type,
                            rdf.sym(indexUrl)
                        )
                    )
                );
            } else {
                const typesFound = graph
                    .each(rootNode, ns.solid('forClass'), null)
                    .map((node) => node.value);
                const typesToDelete = typesFound.reduce(
                    (notFoundTypes, type) =>
                        !containedTypes.includes(type)
                            ? Array.isArray(notFoundTypes)
                                ? [...notFoundTypes, type]
                                : [type]
                            : notFoundTypes,
                    []
                );
                const typesToAdd = containedTypes.reduce(
                    (notFoundTypes, type) =>
                        !typesFound.includes(type)
                            ? [...notFoundTypes, type]
                            : notFoundTypes,
                    []
                );
                typesToDelete.forEach((type) =>
                    graph
                        .statementsMatching(
                            rootNode,
                            ns.solid('forClass'),
                            rdf.sym(type)
                        )
                        .forEach((st) => del.push(st))
                );
                typesToAdd.forEach((type) =>
                    ins.push(
                        rdf.st(
                            rootNode,
                            ns.solid('forClass'),
                            type,
                            rdf.sym(indexUrl)
                        )
                    )
                );
            }
        } else {
            let rootNode = graph.any(
                null,
                ns.solid('instance'),
                rdf.sym(item.url)
            );

            if (!rootNode) {
                rootNode = new rdf.BlankNode();
                ins.push(
                    rdf.st(
                        rootNode,
                        ns.rdf('type'),
                        ns.solid('TypeRegistration'),
                        rdf.sym(indexUrl)
                    )
                );
                ins.push(
                    rdf.st(
                        rootNode,
                        ns.solid('instance'),
                        rdf.sym(item.url),
                        rdf.sym(indexUrl)
                    )
                );
                ins.push(
                    rdf.st(
                        rootNode,
                        ns.solid('forClass'),
                        types(item.type + '#Resource'),
                        rdf.sym(indexUrl)
                    )
                );
            } else {
                const currentType = graph
                    .any(rootNode, ns.solid('forClass'), null)
                    .value.replace(types(), '')
                    .replace('#Resource', '');
                if (currentType !== item.type) {
                    graph
                        .statementsMatching(rootNode, ns.solid('forClass'))
                        .forEach((st) => del.push(st));
                    ins.push(
                        rdf.st(
                            rootNode,
                            ns.solid('forClass'),
                            types(item.type + '#Resource'),
                            rdf.sym(indexUrl)
                        )
                    );
                }
            }
        }
    });
    return [del, ins];
};
