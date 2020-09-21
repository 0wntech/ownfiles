(function (factory) {
    if (typeof module === "object" && typeof module.exports === "object") {
        var v = factory(require, exports);
        if (v !== undefined) module.exports = v;
    }
    else if (typeof define === "function" && define.amd) {
        define(["require", "exports", "mime"], factory);
    }
})(function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.update = void 0;
    var mime_1 = require("mime");
    exports.update = function (resource, content, contentType) {
        var _a;
        if (contentType === void 0) { contentType = 'text/turtle'; }
        if (mime_1.getType(resource))
            contentType = (_a = mime_1.getType(resource)) !== null && _a !== void 0 ? _a : contentType;
        return this.fetcher.webOperation('PUT', resource, {
            "data": content,
            "contentType": contentType,
        });
    };
});
//# sourceMappingURL=update.js.map