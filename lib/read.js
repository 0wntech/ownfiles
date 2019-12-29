const rdf = require('rdflib');
const ns = require('solid-namespace')(rdf);
const url = require('url');

module.exports.read = function(resource, options = {}) {
    const store = this.graph;
    const fetcher = this.fetcher;

    if (options.auth) {
        options.headers = options.headers ? options.headers : {};
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
                        return parseResult(resource, store);
                    } else {
                        return result;
                    }
                });
            });
    } else {
        return fetcher
            .load(resource, { force: true, clearPreviousData: true })
            .then((result) => {
                if (isFolder(result.responseText, resource, store)) {
                    return parseResult(resource, store);
                } else {
                    return result.responseText;
                }
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

const parseResult = (resource, store) => {
    const containments = { folders: [], files: [] };
    store
        .each(rdf.sym(resource), ns.ldp('contains'), undefined)
        .map((result) => {
            return result.value;
        })
        .forEach((result) => {
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
                containments.files.push(result);
            }
        });
    return containments;
};
