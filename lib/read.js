const rdf = require('rdflib');
const ns = require('solid-namespace')(rdf);
const url = require('url');
const mime = require('mime');

module.exports.read = function(
    resource,
    options = { headers: { Accept: 'text/turtle' }, auth: false }
) {
    const store = this.graph;
    const fetcher = this.fetcher;

    if (options.auth) {
        return options.auth
            .fetch(resource, {
                headers: options.headers,
            })
            .then((res) => {
                return res.text().then((result) => {
                    if (isFolder(result, resource, store)) {
                        console.log(
                            store.each(rdf.sym(resource), ns.ldp('contains'))
                        );
                        return parseResult(resource, store, options.verbose);
                    } else {
                        return result;
                    }
                });
            });
    } else {
        return fetcher
            .load(resource, {
                force: true,
                clearPreviousData: true,
                headers: options.headers,
            })
            .then(async (result) => {
                if (isFolder(result.responseText, resource, store)) {
                    return parseResult(resource, store, options.verbose);
                }
                const body =
                    typeof result.responseText !== 'undefined'
                        ? result.responseText
                        : await result.text();
                return body;
            });
    }
};

const isFolder = (result, resource, store) => {
    try {
        if (result) {
            rdf.parse(result, store, resource, 'text/turtle');
        }
        return store.holds(
            rdf.sym(resource),
            ns.rdf('type'),
            ns.ldp('BasicContainer')
        );
    } catch (_) {
        return false;
    }
};

const parseResult = (resource, store, verbose = false) => {
    const containments = { folders: [], files: [] };
    store
        .each(rdf.sym(resource), ns.ldp('contains'), undefined)
        .map((result) => {
            return result.value;
        })
        .forEach((result) => {
            const type = store.statementsMatching(
                rdf.sym(result),
                ns.rdf('type')
            )[0].object;
            const isLinked = ((type) =>
                type.value ===
                'http://www.w3.org/ns/iana/media-types/text/turtle#Resource')(
                type
            );
            let resultFragments = url.parse(result).pathname.split('/');
            if (resultFragments[1] === '') {
                resultFragments.shift();
                result = result.replace(
                    url.parse(result).pathname,
                    resultFragments.join('/')
                );
                resultFragments = url.parse(result).pathname.split('/');
            }
            if (resultFragments[resultFragments.length - 1] === '') {
                containments.folders.push(result);
            } else {
                if (verbose) {
                    containments.files.push({
                        name: result,
                        type: !isLinked ? mime.getType(result) : 'rdf',
                    });
                } else {
                    containments.files.push(result);
                }
            }
        });
    return containments;
};
