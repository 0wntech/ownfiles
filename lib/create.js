var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
(function (factory) {
    if (typeof module === "object" && typeof module.exports === "object") {
        var v = factory(require, exports);
        if (v !== undefined) module.exports = v;
    }
    else if (typeof define === "function" && define.amd) {
        define(["require", "exports", "url", "mime"], factory);
    }
})(function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.createIfNotExist = exports.createFile = exports.createFolder = exports.create = void 0;
    var url_1 = __importDefault(require("url"));
    var mime_1 = __importDefault(require("mime"));
    exports.create = function (resourceAddress, options) {
        if (options === void 0) { options = {}; }
        if (!resourceAddress) {
            throw new Error('Please specify the location for the new resource.');
        }
        else if (url_1.default.parse(resourceAddress).protocol !== 'https:') {
            throw new Error('Please specify a valid location for the new resource.');
        }
        var paths = resourceAddress.split('/');
        if (!options.name) {
            if (paths[paths.length - 1] !== '') {
                options.name = paths[paths.length - 1];
                paths.pop();
                return this.createFile(paths.join('/') + '/', options);
            }
            else {
                options.name = paths[paths.length - 2];
                paths.pop();
                paths.pop();
                return this.createFolder(paths.join('/') + '/', options);
            }
        }
        else if (resourceAddress.endsWith('/')) {
            paths.pop();
            paths.pop();
            return this.createFolder(paths.join('/') + '/', options);
        }
        else {
            paths.pop();
            return this.createFile(paths.join('/') + '/', options);
        }
    };
    exports.createFolder = function (folderAddress, options) {
        var _a;
        var request = {
            "headers": {
                "slug": (_a = options === null || options === void 0 ? void 0 : options.name) !== null && _a !== void 0 ? _a : 'Untitled Folder',
                "link": '<http://www.w3.org/ns/ldp#BasicContainer>; rel="type"',
                'Content-Type': 'text/turtle',
            },
        };
        return this.fetcher.webOperation('POST', folderAddress, request);
    };
    exports.createFile = function (fileAddress, options) {
        var _a, _b, _c;
        if (options === void 0) { options = {}; }
        var stringContent = options.contents;
        var blobContent = options.contents;
        var anyContent = options.contents;
        var body = (_a = stringContent !== null && stringContent !== void 0 ? stringContent : blobContent) !== null && _a !== void 0 ? _a : bodyFromContent(anyContent);
        if (options.name) {
            options.contentType = (_c = (_b = options.contentType) !== null && _b !== void 0 ? _b : mime_1.default.getType(options.name)) !== null && _c !== void 0 ? _c : 'text/turtle';
            var fileExtension = (options.contentType === 'image/jpeg' ||
                options.contentType === 'application/octet-stream') &&
                options.name &&
                options.name.split('.')[1] === 'jpg'
                ? 'jpg'
                : mime_1.default.getExtension(options.contentType);
            fileAddress = "" + fileAddress + options.name.split('.')[0] + "." + fileExtension;
        }
        var request = {
            "contentType": options.contentType,
            "data": body,
        };
        return this.fetcher.webOperation('PUT', fileAddress, request);
    };
    exports.createIfNotExist = function (resourceAddress, options) {
        var _this = this;
        if (options === void 0) { options = { "headers": {} }; }
        return this.fetcher
            ._fetch(resourceAddress, { "headers": options.headers })
            .then(function (res) {
            if (res.status === 200) {
                return;
            }
            else {
                return _this.create(resourceAddress, options);
            }
        });
    };
    function bodyFromContent(content) {
        if (content) {
            if (Array.isArray(content)) {
                if (content.every(function (el) {
                    return el.constructor.name === 'Statement';
                })) {
                    var bodyString_1 = '';
                    content.forEach(function (st) {
                        bodyString_1 += st.toNT() + '\n';
                    });
                    return bodyString_1;
                }
            }
            else {
                return content;
            }
        }
        else {
            return '';
        }
    }
});
//# sourceMappingURL=create.js.map