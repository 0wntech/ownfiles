const url = require('url');
const mime = require('mime');

module.exports.create = function(resourceAddress, options = {}) {
    if (!resourceAddress) {
        throw new Error('Please specify the location for the new resource.');
    } else if (url.parse(resourceAddress).protocol !== 'https:') {
        throw new Error(
            'Please specify a valid location for the new resource.'
        );
    }

    const paths = resourceAddress.split('/');
    if (!options.name) {
        if (paths[paths.length - 1] !== '') {
            options.name = paths[paths.length - 1];
            paths.pop();
            return this.createFile(paths.join('/') + '/', options);
        } else {
            options.name = paths[paths.length - 2];
            paths.pop();
            paths.pop();
            return this.createFolder(paths.join('/') + '/', options);
        }
    } else if (resourceAddress.endsWith('/')) {
        paths.pop();
        paths.pop();
        return this.createFolder(paths.join('/') + '/', options);
    } else {
        paths.pop();
        return this.createFile(paths.join('/') + '/', options);
    }
};

module.exports.createFolder = function(folderAddress, options) {
    const request = {
        headers: {
            'slug': options.name,
            'link': '<http://www.w3.org/ns/ldp#BasicContainer>; rel="type"',
            'Content-Type': 'text/turtle',
        },
    };

    return this.fetcher
        .webOperation('POST', folderAddress, request)
        .catch((err) => {
            throw err;
        });
};

module.exports.createFile = function(fileAddress, options = {}) {
    const body = bodyFromContent(options.contents);
    options.contentType = options.contentType
        ? options.contentType
        : mime.getType(options.name);
    options.contentType = options.contentType
        ? options.contentType
        : 'text/turtle';

    const request = {
        contentType: options.contentType,
        data: body,
    };

    const fileExtension =
        (options.contentType === 'image/jpeg' ||
            options.contentType === 'application/octet-stream') &&
        options.name.split('.')[1] === 'jpg'
            ? 'jpg'
            : mime.getExtension(options.contentType);

    fileAddress = `${fileAddress}${
        options.name.split('.')[0]
    }.${fileExtension}`;

    return this.fetcher
        .webOperation('PUT', fileAddress, request)
        .catch((err) => {
            throw err;
        });
};

module.exports.createIfNotExist = function(
    resourceAddress,
    options = { headers: {} }
) {
    return this.fetcher
        ._fetch(resourceAddress, { headers: options.headers })
        .then((res) => {
            if (res.status === 200) {
                return;
            } else {
                return this.create(resourceAddress, options);
            }
        });
};

function bodyFromContent(content) {
    if (content) {
        if (Array.isArray(content)) {
            if (
                content.every((el) => {
                    return el.constructor.name === 'Statement';
                })
            ) {
                let bodyString = '';
                content.forEach((st) => {
                    bodyString += st.toNT() + '\n';
                });
                return bodyString;
            }
        } else {
            return content;
        }
    } else {
        return '';
    }
}
