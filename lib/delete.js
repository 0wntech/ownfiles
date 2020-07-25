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
            'Please specify the item/items you would like to delete.'
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
                .then((res) => {
                    const files = store.each(
                        rdf.sym(resource),
                        ns.ldp('contains')
                    );
                    const promises = files.map((file) => {
                        if (
                            store.holds(
                                file,
                                ns.rdf('type'),
                                ns.ldp('BasicContainer')
                            )
                        ) {
                            const fileFragments = file.uri.split('/');
                            const folderName =
                                fileFragments[fileFragments.length - 2];
                            if (resource.endsWith('/')) {
                                return deleteRecursively(
                                    resource + folderName + '/'
                                );
                            } else {
                                return deleteRecursively(
                                    resource + '/' + folderName + '/'
                                );
                            }
                        } else {
                            const fileFragments = file.uri.split('/');
                            const fileName =
                                fileFragments[fileFragments.length - 1];
                            return fetcher.webOperation(
                                'DELETE',
                                resource + fileName
                            );
                        }
                    });
                    Promise.all(promises)
                        .then(() => {
                            fetcher
                                .webOperation('DELETE', resource)
                                .then((res) => {
                                    console.log(
                                        `DEBUG -- Successfully deleted ${resource}`
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
                            reject(new Error(err));
                        });
                });
        }.bind(this)
    );
}
