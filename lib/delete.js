const rdf = require('rdflib');
const ns = require('solid-namespace')(rdf);

module.exports.delete = function(resources) {
    if (resources) {
        deleteRecursively = deleteRecursively.bind(this);
        if (Array.isArray(resources)) {
            resources.map((item) => {
                return deleteRecursively(item);
            });
            return Promise.all(resources);
        } else {
            return deleteRecursively(resources);
        }
    } else {
        throw new Error(
            'Please specify the item/items you would like to delete.',
        );
    }
};

function deleteRecursively(resource) {
    return new Promise(
        function(resolve, reject) {
            const store = this.graph;
            const fetcher = this.fetcher;
            fetcher
                .load(resource, { force: true, clearPreviousData: true })
                .then(() => {
                    const files = store.each(
                        rdf.sym(resource),
                        ns.ldp('contains'),
                    );
                    const promises = files.map((file) => {
                        if (
                            store.holds(
                                file,
                                ns.rdf('type'),
                                ns.ldp('BasicContainer'),
                            )
                        ) {
                            return deleteRecursively(file.uri);
                        } else {
                            return fetcher.webOperation('DELETE', file.uri);
                        }
                    });
                    Promise.all(promises)
                        .then(() => {
                            fetcher
                                .webOperation('DELETE', resource)
                                .then((res) => {
                                    console.log(
                                        `DEBUG -- Successfully deleted ${resource}`,
                                    );
                                    resolve(res);
                                })
                                .catch((err) => {
                                    reject(new Error(err));
                                });
                        })
                        .catch((err) => {
                            reject(new Error(err));
                        });
                })
                .catch(() => {
                    fetcher
                        .webOperation('DELETE', resource)
                        .then((res) => {
                            resolve(res);
                        })
                        .catch((err) => {
                            reject(err);
                        });
                });
        }.bind(this),
    );
}
