(function (factory) {
    if (typeof module === "object" && typeof module.exports === "object") {
        var v = factory(require, exports);
        if (v !== undefined) module.exports = v;
    }
    else if (typeof define === "function" && define.amd) {
        define(["require", "exports", "rdflib", "solid-namespace"], factory);
    }
})(function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.deleteRecursively = exports.deleteResource = void 0;
    var rdf = require("rdflib");
    var ns = require("solid-namespace");
    exports.deleteResource = function (resources) {
        var _this = this;
        if (resources) {
            if (Array.isArray(resources)) {
                resources.map(function (item) {
                    return _this.deleteRecursively(item);
                });
                return Promise.all(resources);
            }
            else {
                return this.deleteRecursively(resources);
            }
        }
        else {
            throw new Error('Please specify the item/items you would like to delete.');
        }
    };
    exports.deleteRecursively = function (resource) {
        var _this = this;
        var store = this.graph;
        var fetcher = this.fetcher;
        return new Promise(function (resolve, reject) {
            fetcher
                .load(resource, { "force": true, "clearPreviousData": true })
                .then(function () {
                var files = store.each(rdf.sym(resource), ns(rdf).ldp('contains'));
                var promises = files.map(function (file) {
                    if (store.holds(file, ns(rdf).rdf('type'), ns(rdf).ldp('BasicContainer'))) {
                        var fileFragments = file.uri.split('/');
                        var folderName = fileFragments[fileFragments.length - 2];
                        if (resource.endsWith('/')) {
                            return _this.deleteRecursively(resource + folderName + '/');
                        }
                        else {
                            return _this.deleteRecursively(resource + '/' + folderName + '/');
                        }
                    }
                    else {
                        var fileFragments = file.uri.split('/');
                        var fileName = fileFragments[fileFragments.length - 1];
                        return fetcher.webOperation('DELETE', resource + fileName);
                    }
                });
                Promise.all(promises).then(function () {
                    fetcher
                        .webOperation('DELETE', resource)
                        .then(function (res) {
                        console.log("DEBUG -- Successfully deleted " + resource);
                        resolve(res);
                    })
                        .catch(function (err) {
                        reject(err);
                    });
                });
            })
                .catch(function (err) {
                console.log(err);
                fetcher
                    .webOperation('DELETE', resource)
                    .then(function (res) {
                    resolve(res);
                })
                    .catch(function (err) {
                    reject(err);
                });
            });
        });
    };
});
//# sourceMappingURL=delete.js.map