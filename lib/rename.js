var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
(function (factory) {
    if (typeof module === "object" && typeof module.exports === "object") {
        var v = factory(require, exports);
        if (v !== undefined) module.exports = v;
    }
    else if (typeof define === "function" && define.amd) {
        define(["require", "exports", "mime", "url", "rdflib", "solid-namespace"], factory);
    }
})(function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.renameFile = exports.renameFolder = void 0;
    var mime_1 = __importDefault(require("mime"));
    var url_1 = __importDefault(require("url"));
    var rdf = require("rdflib");
    var ns = require("solid-namespace");
    exports.renameFolder = function (resource, newName) {
        var _this = this;
        return new Promise(function (resolve, reject) {
            _this.fetcher.load(resource).then(function () {
                var oldFolderName = resource.split('/');
                if (resource.endsWith('/')) {
                    oldFolderName.pop();
                    oldFolderName.pop();
                }
                else {
                    oldFolderName.pop();
                }
                var newFolderLocation = oldFolderName.join('/');
                oldFolderName.push(newName);
                var newFolderUrl = oldFolderName.join('/');
                _this.create(newFolderUrl + '/').then(function (res) {
                    var _a;
                    var newFolderName = (_a = res.headers.get('location')) !== null && _a !== void 0 ? _a : newFolderUrl + '/';
                    console.log("DEBUG -- Successfully copied " + resource + " to " + newFolderName);
                    var copies = _this.graph
                        .each(rdf.sym(resource), ns(rdf).ldp('contains'))
                        .map(function (containment) {
                        return _this.copy(containment.value, url_1.default.resolve(newFolderLocation, newFolderName));
                    });
                    Promise.all(copies)
                        .then(function () {
                        _this.delete(resource)
                            .then(function () {
                            console.log("DEBUG -- Successfully rename " + resource + " to " + newName);
                            resolve();
                        })
                            .catch(function (err) {
                            reject(err);
                        });
                    })
                        .catch(function (err) {
                        reject(err);
                    });
                });
            });
        });
    };
    exports.renameFile = function (resource, newName) {
        var _this = this;
        return this.read(resource).then(function (content) {
            var _a;
            var stringContent = content;
            var blobContent = content;
            var options = {
                "name": newName,
                "contents": (_a = stringContent !== null && stringContent !== void 0 ? stringContent : blobContent) !== null && _a !== void 0 ? _a : '',
                "contentType": mime_1.default.getType(newName) ||
                    mime_1.default.getType(resource) ||
                    'text/turtle',
            };
            var location = '';
            if (resource.endsWith('/')) {
                var resourceFragments = resource.split('/');
                resourceFragments.pop();
                resourceFragments.pop();
                location = resourceFragments.join('/');
            }
            else {
                var resourceFragments = resource.split('/');
                resourceFragments.pop();
                location = resourceFragments.join('/');
            }
            var newLocation = url_1.default.resolve(location, newName);
            return _this.create(newLocation, options).then(function () {
                console.log("DEBUG -- Successfully renamed " + resource + " to " + newName);
                return _this.delete(resource);
            });
        });
    };
});
//# sourceMappingURL=rename.js.map