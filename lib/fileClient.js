var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
(function (factory) {
    if (typeof module === "object" && typeof module.exports === "object") {
        var v = factory(require, exports);
        if (v !== undefined) module.exports = v;
    }
    else if (typeof define === "function" && define.amd) {
        define(["require", "exports", "rdflib", "./create", "./read", "./copy", "./update", "./rename", "./delete", "./deepRead", "./indexing"], factory);
    }
})(function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var rdf = require("rdflib");
    var create_1 = require("./create");
    var read_1 = require("./read");
    var copy_1 = require("./copy");
    var update_1 = require("./update");
    var rename_1 = require("./rename");
    var deleting = __importStar(require("./delete"));
    var deepRead_1 = require("./deepRead");
    var indexing_1 = require("./indexing");
    var FileClient = /** @class */ (function () {
        function FileClient() {
            this.graph = rdf.graph();
            this.fetcher = new rdf.Fetcher(this.graph);
            this.updater = new rdf.UpdateManager(this.graph);
            this.create = create_1.create;
            this.createFile = create_1.createFile;
            this.createFolder = create_1.createFolder;
            this.createIfNotExist = create_1.createIfNotExist;
            this.read = read_1.read;
            this.copy = copy_1.copy;
            this.renameFile = rename_1.renameFile;
            this.renameFolder = rename_1.renameFolder;
            this.delete = deleting.deleteResource;
            this.deleteRecursively = deleting.deleteRecursively;
            this.update = update_1.update;
            this.deepRead = deepRead_1.deepRead;
            this.createIndex = indexing_1.createIndex;
            this.deleteIndex = indexing_1.deleteIndex;
            this.readIndex = indexing_1.readIndex;
            this.copyFile = copy_1.copyFile;
            this.copyFolder = copy_1.copyFolder;
        }
        return FileClient;
    }());
    exports.default = FileClient;
});
//# sourceMappingURL=fileClient.js.map