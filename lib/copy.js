const rdf = require("rdflib");
const ns = require("solid-namespace")(rdf);
const url = require("url");
const mime = require("mime");

module.exports.copy = function(resource, location) {
  if (resource) {
    if (location) {
      return this.fetcher.load(location).then(res => {
        if (
          this.graph.each(
            rdf.sym(location),
            ns.rdf("type"),
            ns.ldp("Container")
          ).length === 0
        ) {
          console.log(res);
          throw new Error("The specified Location is not a folder");
        } else {
          copyFolder = copyFolder.bind(this);
          copyFile = copyFile.bind(this);
          if (resource.endsWith("/")) {
            return copyFolder(resource, location);
          } else {
            return copyFile(resource, location);
          }
        }
      });
    }
  }
};

function copyFile(resource, location) {
  return this.read(resource).then(content => {
    const options = {};
    options.name = resource.substr(resource.lastIndexOf("/") + 1);

    options.contentType = mime.getType(options.name);
    options.contentType = options.contentType
      ? options.contentType
      : "text/turtle";
    options.contents = content;

    location = location.endsWith("/") ? location : location + "/";
    const newLocation = url.resolve(location, options.name);
    console.log(newLocation);
    return this.create(newLocation, options).then(() => {
      console.log(`DEBUG -- Successfully copied ${resource} to ${location}`);
    });
  });
}

function copyFolder(resource, location) {
  console.log(resource, location);
  return new Promise((resolve, reject) => {
    this.fetcher.load(resource).then(() => {
      let oldFolderName = resource.split("/");
      oldFolderName = oldFolderName[oldFolderName.length - 2];
      const newFolderUrl = url.resolve(location + "/", oldFolderName);
      this.create(newFolderUrl + "/").then(() => {
        console.log(`DEBUG -- Successfully copied ${resource} at ${location}`);
        const copies = this.graph
          .each(rdf.sym(resource), ns.ldp("contains"))
          .map(containment => {
            return this.copy(containment.value, newFolderUrl);
          });
        Promise.all(copies)
          .then(() => {
            console.log(
              `DEBUG -- Successfully copied ${resource}'s contents to ${location}`
            );
            resolve();
          })
          .catch(err => {
            reject(err);
          });
      });
    });
  });
}