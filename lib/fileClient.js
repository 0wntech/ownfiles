const url = require("url");
const rdf = require("rdflib");
const { create } = require("./create.js");
const { read } = require("./read.js");
const { copy } = require("./copy.js");
const deleting = require("./delete.js");

function PodClient({ podUrl = undefined, User = undefined }) {
  if (User) {
    if (User.webId) {
      this.of = User.webId.replace("profile/card#me");
    } else {
      throw new Error("The specified User doesn't have a webId.");
    }
  } else if (podUrl) {
    const parsedPodUrl = url.parse(podUrl);
    if (parsedPodUrl.protocol && parsedPodUrl.host) {
      this.of = podUrl;
    } else {
      throw new Error("Please enter a valid webId.");
    }
  } else {
    throw new Error("Please specify the url of the pod you want to modify.");
  }

  this.graph = rdf.graph();
  this.fetcher = new rdf.Fetcher(this.graph);
  this.create = create;
  this.read = read;
  this.copy = copy;
  this.delete = deleting.delete;
}

module.exports = PodClient;
