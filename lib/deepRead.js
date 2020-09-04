module.exports.deepRead = async function(
    folderUrl,
    options = { auth: null, verbose: false }
) {
    const deepRead = await this.read(folderUrl, { verbose: true })
        .then((folder) => {
            const folderList = folder.folders.map((folder) =>
                Promise.resolve(this.deepRead(folder, options))
            );
            const fileList = folder.files.map(
                (file) =>
                    new Promise(function(resolve) {
                        if (options.verbose) {
                            resolve({ url: file.name, type: file.type });
                        } else {
                            resolve(file.name);
                        }
                    })
            );
            return Promise.all([
                ...folderList,
                ...fileList,
                new Promise(function(resolve) {
                    if (options.verbose) {
                        resolve({ url: folderUrl, type: 'folder' });
                    } else {
                        resolve(folderUrl);
                    }
                }),
            ]);
        })
        .catch(() =>
            options.verbose ? [{ url: folderUrl, type: 'folder' }] : [folderUrl]
        )
        .then(function(results) {
            return flattenArray(results)
                .sort((fileA, fileB) =>
                    sortByDepth(fileA, fileB, options.verbose)
                )
                .reverse();
        });

    return deepRead;
};

function flattenArray(array) {
    let result = [];
    for (let i = 0; i < array.length; i++) {
        const element = array[i];
        if (Array.isArray(element)) {
            result = [...result, ...flattenArray(element)];
        } else {
            result = [...result, element];
        }
    }
    return result;
}

function sortByDepth(fileA, fileB, verbose) {
    if (verbose) {
        fileA = fileA.url;
        fileB = fileB.url;
    }
    const depthA = fileA.split('/').length;
    const depthB = fileB.split('/').length;

    return depthA - depthB;
}
