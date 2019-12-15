const url = require("url");
const rdf = require("rdflib");
const { create } = require("./create.js");
const { read } = require("./read.js");
const { copy } = require("./copy.js");
const { update } = require("./update.js");
const { renameFile, renameFolder } = require("./rename.js");
const deleting = require("./delete.js");

function fileClient() {
  this.graph = rdf.graph();
  this.fetcher = new rdf.Fetcher(this.graph);

  this.create = create;
  this.read = read;
  this.copy = copy;
  this.renameFile = renameFile;
  this.renameFolder = renameFolder;
  this.delete = deleting.delete;
  this.update = update
}

module.exports = fileClient;
