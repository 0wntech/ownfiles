const rdf = require('rdflib');
const {
    create,
    createFile,
    createFolder,
    createIfNotExist,
} = require('./create.js');
const { read } = require('./read.js');
const { copy } = require('./copy.js');
const { update } = require('./update.js');
const { renameFile, renameFolder } = require('./rename.js');
const deleting = require('./delete.js');
const { deepRead } = require('./deepRead.js');
const { createIndex, readIndex } = require('./indexing.js');

function fileClient() {
    this.graph = rdf.graph();
    this.fetcher = new rdf.Fetcher(this.graph);
    this.updater = new rdf.UpdateManager(this.graph);

    this.create = create;
    this.createFile = createFile;
    this.createFolder = createFolder;
    this.createIfNotExist = createIfNotExist;
    this.read = read;
    this.copy = copy;
    this.renameFile = renameFile;
    this.renameFolder = renameFolder;
    this.delete = deleting.delete;
    this.update = update;
    this.deepRead = deepRead;
    this.createIndex = createIndex;
    this.readIndex = readIndex;
}

module.exports = fileClient;
