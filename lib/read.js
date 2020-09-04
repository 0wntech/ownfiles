const rdf = require('rdflib');
const ns = require('solid-namespace')(rdf);
const url = require('url');
const mime = require('mime');

module.exports.read = async function(
    resource,
    options = {
        auth: false,
        verbose: false,
        headers: {
            Accept: mime.getType(resource)
                ? mime.getType(resource)
                : 'text/turtle',
        },
    }
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
    } catch (err) {
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
                        type: !isLinked ? mime.getType(result) : 'text/turtle',
                    });
                } else {
                    containments.files.push(result);
                }
            }
        });
    return containments;
};
