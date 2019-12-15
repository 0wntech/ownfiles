const { getType } = require('mime');

module.exports.update = function(resource, content) {
    const contentType = getType(resource);
    return this.fetcher.webOperation('PUT', resource, {
        data: content,
        contentType: contentType,
    });
};
