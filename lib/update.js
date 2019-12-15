const { getType } = require('mime')

module.exports.update = function (url, content) {
    const contentType = getType(url);
    return this.fetcher.webOperation('PUT', url, {
        data: content,
        contentType: contentType
    })
}