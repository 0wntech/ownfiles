module.exports.deepRead = async function(
    folderUrl,
    options = { auth: null, cacheResult: false }
) {
    const deepRead = await this.read(folderUrl)
        .then((folder) => {
            const folderList = folder.folders.map((folder) =>
                Promise.resolve(this.deepRead(folder))
            );
            const fileList = folder.files.map(
                (file) =>
                    new Promise(function(resolve) {
                        resolve(file);
                    })
            );
            return Promise.all([
                ...folderList,
                ...fileList,
                new Promise(function(resolve) {
                    resolve(folderUrl);
                }),
            ]);
        })
        .catch(() => [folderUrl])
        .then(function(results) {
            return flattenArray(results)
                .sort(sortByDepth)
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

function sortByDepth(fileA, fileB) {
    const depthA = fileA.split('/').length;
    const depthB = fileB.split('/').length;

    return depthA - depthB;
}

module.exports.searchTree = (query, tree) => {
    return '';
};
