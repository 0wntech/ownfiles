var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var __spreadArrays = (this && this.__spreadArrays) || function () {
    for (var s = 0, i = 0, il = arguments.length; i < il; i++) s += arguments[i].length;
    for (var r = Array(s), k = 0, i = 0; i < il; i++)
        for (var a = arguments[i], j = 0, jl = a.length; j < jl; j++, k++)
            r[k] = a[j];
    return r;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
(function (factory) {
    if (typeof module === "object" && typeof module.exports === "object") {
        var v = factory(require, exports);
        if (v !== undefined) module.exports = v;
    }
    else if (typeof define === "function" && define.amd) {
        define(["require", "exports", "url", "rdflib", "solid-namespace"], factory);
    }
})(function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.readIndex = exports.deleteIndex = exports.createIndex = void 0;
    var url_1 = __importDefault(require("url"));
    var rdf = require("rdflib");
    var ns = require("solid-namespace");
    var typeNamespaceUrl = 'http://www.w3.org/ns/iana/media-types/';
    var types = new rdf.Namespace(typeNamespaceUrl);
    exports.createIndex = function (user) {
        return __awaiter(this, void 0, void 0, function () {
            var userUrl, rootUrl, indexUrl, items, _a, del, ins;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        userUrl = url_1.default.parse(user);
                        rootUrl = userUrl.protocol + "//" + userUrl.host + "/";
                        indexUrl = rootUrl + 'settings/fileIndex.ttl';
                        return [4 /*yield*/, this.createIfNotExist(indexUrl)];
                    case 1:
                        _b.sent();
                        return [4 /*yield*/, this.readIndex(indexUrl)];
                    case 2:
                        _b.sent();
                        return [4 /*yield*/, this.deepRead(rootUrl, { "verbose": true })];
                    case 3:
                        items = (_b.sent());
                        _a = getNewIndexTriples(items, this.graph, indexUrl), del = _a[0], ins = _a[1];
                        return [4 /*yield*/, this.updater.update(del, ins)];
                    case 4:
                        _b.sent();
                        return [2 /*return*/, this.readIndex(indexUrl)];
                }
            });
        });
    };
    exports.deleteIndex = function (user) {
        return __awaiter(this, void 0, void 0, function () {
            var userUrl, rootUrl, indexUrl;
            return __generator(this, function (_a) {
                userUrl = url_1.default.parse(user);
                rootUrl = userUrl.protocol + "//" + userUrl.host + "/";
                indexUrl = rootUrl + 'settings/fileIndex.ttl';
                return [2 /*return*/, this.delete(indexUrl)];
            });
        });
    };
    exports.readIndex = function (user) {
        var _this = this;
        var userUrl = url_1.default.parse(user);
        var rootUrl = userUrl.protocol + "//" + userUrl.host + "/";
        var indexUrl = rootUrl + 'settings/fileIndex.ttl';
        return this.fetcher.load(indexUrl).then(function (res) {
            if (res.status !== 200) {
                return undefined;
            }
            else {
                return readIndexTriples(indexUrl, _this.graph);
            }
        });
    };
    var readIndexTriples = function (indexUrl, graph) {
        if (!graph.any(null, null, null, rdf.sym(indexUrl))) {
            return;
        }
        var index = [];
        graph
            .each(null, ns(rdf).rdf('type'), ns(rdf).solid('TypeRegistration'))
            .forEach(function (indexNode) {
            var urlNode = graph.any(indexNode, ns(rdf).solid('instance')) ||
                graph.any(indexNode, ns(rdf).solid('instanceContainer'));
            var nodeTypes = graph
                .statementsMatching(indexNode, ns(rdf).solid('forClass'))
                .map(function (statement) {
                return statement.object.value
                    .replace(typeNamespaceUrl, '')
                    .replace('#Resource', '');
            });
            index.push({ "url": urlNode.value, "types": nodeTypes });
        });
        return index;
    };
    var getNewIndexTriples = function (items, graph, indexUrl) {
        var statement = rdf.st();
        var del = [];
        var ins = [];
        items.forEach(function (item) {
            if (item.type === 'folder') {
                var rootNode_1 = graph.any(null, ns(rdf).solid('instanceContainer'), rdf.sym(item.url));
                var containedTypes_1 = items
                    .reduce(function (allTypes, currentItem) {
                    return currentItem.url.includes(item.url) &&
                        currentItem.type &&
                        currentItem.type !== null &&
                        currentItem.type !== 'folder'
                        ? __spreadArrays(allTypes, [
                            types(currentItem.type + '#Resource'),
                        ]) : allTypes;
                }, [])
                    .filter(function (currentType, index, allNodes) {
                    return allNodes.findIndex(function (type) { return currentType === type; }) === index;
                });
                if (!rootNode_1) {
                    rootNode_1 = new rdf.BlankNode();
                    ins.push(rdf.st(rootNode_1, ns(rdf).rdf('type'), ns(rdf).solid('TypeRegistration'), rdf.sym(indexUrl)));
                    ins.push(rdf.st(rootNode_1, ns(rdf).solid('instanceContainer'), rdf.sym(item.url), rdf.sym(indexUrl)));
                    containedTypes_1.forEach(function (type) {
                        return ins.push(rdf.st(rootNode_1, ns(rdf).solid('forClass'), type, rdf.sym(indexUrl)));
                    });
                }
                else {
                    var typesFound_1 = graph
                        .each(rootNode_1, ns(rdf).solid('forClass'), null)
                        .map(function (node) { return node.value; });
                    var typesToDelete = typesFound_1.reduce(function (notFoundTypes, type) {
                        return !containedTypes_1.includes(type)
                            ? Array.isArray(notFoundTypes)
                                ? __spreadArrays(notFoundTypes, [type]) : [type]
                            : notFoundTypes;
                    }, []);
                    var typesToAdd = containedTypes_1.reduce(function (notFoundTypes, type) {
                        return !typesFound_1.includes(type)
                            ? __spreadArrays(notFoundTypes, [type]) : notFoundTypes;
                    }, []);
                    typesToDelete.forEach(function (type) {
                        return graph
                            .statementsMatching(rootNode_1, ns(rdf).solid('forClass'), rdf.sym(type))
                            .forEach(function (st) { return del.push(st); });
                    });
                    typesToAdd.forEach(function (type) {
                        return ins.push(rdf.st(rootNode_1, ns(rdf).solid('forClass'), type, rdf.sym(indexUrl)));
                    });
                }
            }
            else {
                var rootNode = graph.any(null, ns(rdf).solid('instance'), rdf.sym(item.url));
                if (!rootNode) {
                    rootNode = new rdf.BlankNode();
                    ins.push(rdf.st(rootNode, ns(rdf).rdf('type'), ns(rdf).solid('TypeRegistration'), rdf.sym(indexUrl)));
                    ins.push(rdf.st(rootNode, ns(rdf).solid('instance'), rdf.sym(item.url), rdf.sym(indexUrl)));
                    ins.push(rdf.st(rootNode, ns(rdf).solid('forClass'), types(item.type + '#Resource'), rdf.sym(indexUrl)));
                }
                else {
                    var currentType = graph
                        .any(rootNode, ns(rdf).solid('forClass'), null)
                        .value.replace(types(), '')
                        .replace('#Resource', '');
                    if (currentType !== item.type) {
                        graph
                            .statementsMatching(rootNode, ns(rdf).solid('forClass'))
                            .forEach(function (st) { return del.push(st); });
                        ins.push(rdf.st(rootNode, ns(rdf).solid('forClass'), types(item.type + '#Resource'), rdf.sym(indexUrl)));
                    }
                }
            }
        });
        return [del, ins];
    };
});
//# sourceMappingURL=indexing.js.map