const url = require("url");
const rdf = require("rdflib");
const { create } = require("./create.js");
const { read } = require("./read.js");
const { copy } = require("./copy.js");
const deleting = require("./delete.js");

function PodClient(podUrl, User) {
  this.graph = rdf.graph();
  this.fetcher = new rdf.Fetcher(this.graph);

  this.create = create;
  this.read = read;
  this.copy = copy;
  this.delete = deleting.delete;
}

module.exports = PodClient;
