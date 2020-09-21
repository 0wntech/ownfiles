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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
(function (factory) {
    if (typeof module === "object" && typeof module.exports === "object") {
        var v = factory(require, exports);
        if (v !== undefined) module.exports = v;
    }
    else if (typeof define === "function" && define.amd) {
        define(["require", "exports", "url", "mime", "rdflib", "solid-namespace"], factory);
    }
})(function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.read = void 0;
    var url_1 = __importDefault(require("url"));
    var mime_1 = __importDefault(require("mime"));
    var rdf = require("rdflib");
    var ns = require("solid-namespace");
    exports.read = function (resource, options) {
        var _a;
        if (options === void 0) { options = {
            "auth": false,
            "verbose": false,
            "headers": {
                "Accept": (_a = mime_1.default.getType(resource)) !== null && _a !== void 0 ? _a : 'text/turtle',
            },
        }; }
        return __awaiter(this, void 0, void 0, function () {
            var store, fetcher, response, contentType, text, body, _b;
            return __generator(this, function (_c) {
                switch (_c.label) {
                    case 0:
                        store = this.graph;
                        fetcher = this.fetcher;
                        store.removeDocument(rdf.sym(resource));
                        if (!options.auth) return [3 /*break*/, 2];
                        return [4 /*yield*/, options.auth.fetch(resource, {
                                "headers": options.headers,
                            })];
                    case 1:
                        response = _c.sent();
                        return [3 /*break*/, 4];
                    case 2: return [4 /*yield*/, fetcher._fetch(resource, {
                            "headers": options.headers,
                        })];
                    case 3:
                        response = _c.sent();
                        _c.label = 4;
                    case 4:
                        contentType = response.headers.get('Content-Type');
                        if (!(contentType.includes('text') ||
                            (contentType.includes('application') &&
                                contentType !== 'application/octet-stream'))) return [3 /*break*/, 6];
                        return [4 /*yield*/, response.text()];
                    case 5:
                        text = _c.sent();
                        if (response.headers.get('Content-Type') === 'text/turtle' &&
                            isFolder(text, resource, store)) {
                            return [2 /*return*/, parseResult(resource, store, options.verbose)];
                        }
                        else {
                            if (options.verbose) {
                                return [2 /*return*/, { "body": text, "contentType": contentType }];
                            }
                            else {
                                return [2 /*return*/, text];
                            }
                        }
                        return [3 /*break*/, 11];
                    case 6:
                        if (!response.blob) return [3 /*break*/, 8];
                        return [4 /*yield*/, response.blob()];
                    case 7:
                        _b = _c.sent();
                        return [3 /*break*/, 10];
                    case 8: return [4 /*yield*/, response.buffer()];
                    case 9:
                        _b = _c.sent();
                        _c.label = 10;
                    case 10:
                        body = _b;
                        if (options.verbose) {
                            return [2 /*return*/, { "body": body, "contentType": contentType }];
                        }
                        else {
                            return [2 /*return*/, body];
                        }
                        _c.label = 11;
                    case 11: return [2 /*return*/];
                }
            });
        });
    };
    var isFolder = function (result, resource, store) {
        try {
            if (result) {
                rdf.parse(result, store, resource, 'text/turtle');
            }
            return store.holds(rdf.sym(resource), ns(rdf).rdf('type'), ns(rdf).ldp('BasicContainer'));
        }
        catch (err) {
            return false;
        }
    };
    var parseResult = function (resource, store, verbose) {
        if (verbose === void 0) { verbose = false; }
        var containments = { "folders": [], "files": [] };
        store
            .each(rdf.sym(resource), ns(rdf).ldp('contains'), undefined)
            .map(function (result) {
            return result.value;
        })
            .forEach(function (result) {
            var _a, _b, _c;
            var type = store.statementsMatching(rdf.sym(result), ns(rdf).rdf('type'))[0].object;
            var isLinked = (function (type) {
                return type.value ===
                    'http://www.w3.org/ns/iana/media-types/text/turtle#Resource';
            })(type);
            var resultFragments = (_a = url_1.default.parse(result).pathname) === null || _a === void 0 ? void 0 : _a.split('/');
            if (resultFragments && resultFragments[1] === '') {
                resultFragments.shift();
                var path = (_b = url_1.default.parse(result).pathname) !== null && _b !== void 0 ? _b : result.substr(result.replace('https://', '').indexOf('/'), result.length);
                result = result.replace(path, resultFragments.join('/'));
                resultFragments = path.split('/');
            }
            if (resultFragments &&
                resultFragments[resultFragments.length - 1] === '') {
                containments.folders.push(result);
            }
            else {
                if (verbose) {
                    containments.files.push({
                        "name": result,
                        "type": !isLinked
                            ? (_c = mime_1.default.getType(result)) !== null && _c !== void 0 ? _c : 'text/plain' : 'text/turtle',
                    });
                }
                else {
                    containments.files.push(result);
                }
            }
        });
        return containments;
    };
});
//# sourceMappingURL=read.js.map