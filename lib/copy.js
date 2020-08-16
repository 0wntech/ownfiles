const rdf = require('rdflib');
const ns = require('solid-namespace')(rdf);
const url = require('url');

module.exports.copy = function(resource, location) {
    if (typeof resource === 'string' && typeof location === 'string') {
        return new Promise((resolve, reject) =>
            this.fetcher.load(location).then((res) => {
                if (
                    this.graph.each(
                        rdf.sym(location),
                        ns.rdf('type'),
                        ns.ldp('Container'),
                        rdf.sym(location).doc()
                    ).length < 0
                ) {
                    throw new Error('The specified Location is not a folder');
                } else {
                    copyFolder = copyFolder.bind(this);
                    copyFile = copyFile.bind(this);
                    if (resource.endsWith('/')) {
                        return copyFolder(resource, location)
                            .then(() => {
                                resolve();
                            })
                            .catch((err) => {
                                reject(err);
                            });
                    } else {
                        return copyFile(resource, location)
                            .then(() => {
                                resolve();
                            })
                            .catch((err) => {
                                reject(err);
                            });
                    }
                }
            })
        );
    }
};

function copyFile(resource, location) {
    return this.read(resource, { verbose: true }).then((file) => {
        const options = {};
        options.name = resource.substr(resource.lastIndexOf('/') + 1);

        options.contentType = file.contentType;
        options.contents = file.body;

        location = location.endsWith('/') ? location : location + '/';
        const newLocation = url.resolve(location, options.name);
        return this.create(newLocation, options).then(() => {
            console.log(
                `DEBUG -- Successfully copied ${resource} to ${location}`
            );
        });
    });
}

function copyFolder(resource, location) {
    location = location.endsWith('/') ? location : location + '/';
    return new Promise((resolve, reject) => {
        this.fetcher.load(resource).then(() => {
            let oldFolderName = resource.split('/');
            oldFolderName = oldFolderName[oldFolderName.length - 2];
            const newFolderUrl = url.resolve(location, oldFolderName);
            this.create(newFolderUrl + '/').then((res) => {
                const newFolderName = res.headers.get('location');
                console.log(
                    `DEBUG -- Successfully copied ${resource} to ${location}`
                );
                const copies = this.graph
                    .each(rdf.sym(resource), ns.ldp('contains'))
                    .map((containment) => {
                        return this.copy(
                            containment.value,
                            url.resolve(location, newFolderName)
                        );
                    });
                Promise.all(copies)
                    .then(() => {
                        console.log(
                            `DEBUG -- Successfully copied ${resource}'s contents to ${location}`
                        );
                        resolve();
                    })
                    .catch((err) => {
                        reject(err);
                    });
            });
        });
    });
}
