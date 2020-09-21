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
        define(["require", "exports", "url", "rdflib", "solid-namespace"], factory);
    }
})(function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.copyFolder = exports.copyFile = exports.copy = void 0;
    var url_1 = __importDefault(require("url"));
    var rdf = require("rdflib");
    var ns = require("solid-namespace");
    exports.copy = function (resource, location) {
        var _this = this;
        return new Promise(function (resolve, reject) {
            return _this.fetcher.load(location).then(function () { return __awaiter(_this, void 0, void 0, function () {
                var err_1;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            if (!(this.graph.each(rdf.sym(location), ns(rdf).rdf('type'), ns(rdf).ldp('Container'), rdf.sym(location).doc()).length < 0)) return [3 /*break*/, 1];
                            throw new Error('The specified Location is not a folder');
                        case 1:
                            _a.trys.push([1, 6, , 7]);
                            if (!resource.endsWith('/')) return [3 /*break*/, 3];
                            return [4 /*yield*/, this.copyFolder(resource, location)];
                        case 2:
                            _a.sent();
                            return [3 /*break*/, 5];
                        case 3: return [4 /*yield*/, this.copyFile(resource, location)];
                        case 4:
                            _a.sent();
                            _a.label = 5;
                        case 5:
                            resolve();
                            return [3 /*break*/, 7];
                        case 6:
                            err_1 = _a.sent();
                            reject(err_1);
                            return [3 /*break*/, 7];
                        case 7: return [2 /*return*/];
                    }
                });
            }); });
        });
    };
    exports.copyFile = function copyFile(resource, location) {
        var _this = this;
        return this.read(resource, { "verbose": true }).then(function (file) {
            file = file;
            var fileName = resource.substr(resource.lastIndexOf('/') + 1);
            var options = {
                "name": fileName,
                "contentType": file.contentType,
                "contents": file.body,
            };
            location = location.endsWith('/') ? location : location + '/';
            var newLocation = url_1.default.resolve(location, fileName);
            return _this.create(newLocation, options).then(function (res) {
                console.log("DEBUG -- Successfully copied " + resource + " to " + location);
                return res;
            });
        });
    };
    exports.copyFolder = function copyFolder(resource, location) {
        var _this = this;
        location = location.endsWith('/') ? location : location + '/';
        return new Promise(function (resolve, reject) {
            _this.fetcher.load(resource).then(function () {
                var oldFolderNameFragments = resource.split('/');
                var oldFolderName = oldFolderNameFragments[oldFolderNameFragments.length - 2];
                var newFolderUrl = url_1.default.resolve(location, oldFolderName);
                _this.create(newFolderUrl + '/').then(function (res) {
                    var _a;
                    var newFolderName = (_a = res.headers.get('location')) !== null && _a !== void 0 ? _a : newFolderUrl.substr(newFolderUrl.lastIndexOf('/'), newFolderUrl.length);
                    console.log("DEBUG -- Successfully copied " + resource + " to " + location);
                    var copies = _this.graph
                        .each(rdf.sym(resource), ns(rdf).ldp('contains'))
                        .map(function (containment) {
                        return _this.copy(containment.value, url_1.default.resolve(location, newFolderName));
                    });
                    Promise.all(copies)
                        .then(function () {
                        console.log("DEBUG -- Successfully copied " + resource + "'s contents to " + location);
                        resolve();
                    })
                        .catch(function (err) {
                        reject(err);
                    });
                });
            });
        });
    };
});
//# sourceMappingURL=copy.js.map