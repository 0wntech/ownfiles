const rdf = require("rdflib");
const ns = require("solid-namespace")(rdf);
const mime = require("mime");
const url = require("url");

module.exports.renameFolder = function(resource, newName) {
  return new Promise((resolve, reject) => {
    this.fetcher.load(resource).then(() => {
      const oldFolderName = resource.split("/");
      if (resource.endsWith("/")) {
        oldFolderName.pop();
        oldFolderName.pop();
      } else {
        oldFolderName.pop();
      }
      const newFolderLocation = oldFolderName.join("/");
      oldFolderName.push(newName);
      const newFolderUrl = oldFolderName.join("/");
      console.log(newFolderUrl);
      this.create(newFolderUrl + "/").then(res => {
        const newFolderName = res.headers.get("location");
        console.log(`DEBUG -- Successfully copied ${resource} to ${newFolderName}`);
        const copies = this.graph
          .each(rdf.sym(resource), ns.ldp("contains"))
          .map(containment => {
            return this.copy(containment.value, url.resolve(newFolderLocation, newFolderName));
          });
        Promise.all(copies)
          .then(() => {
            console.log(
              `DEBUG -- Successfully rename ${resource} to ${newName}`
            );
            resolve();
          })
          .catch(err => {
            reject(err);
          });
      });
    });
  });
};

module.exports.renameFile = function(resource, newName) {
  return this.read(resource).then(content => {
    const options = {};
    options.name = newName;

    options.contentType = mime.getType(resource);
    options.contentType = options.contentType
      ? options.contentType
      : "text/turtle";
    options.contents = content;

    let location = "";
    if (resource.endsWith("/")) {
      resourceFragments = resource.split("/");
      resourceFragments.pop();
      resourceFragments.pop();
      location = resourceFragments.join("/");
    } else {
      resourceFragments = resource.split("/");
      resourceFragments.pop();
      location = resourceFragments.join("/");
    }

    const newLocation = url.resolve(location, options.name);
    return this.create(newLocation, options).then(() => {
      console.log(`DEBUG -- Successfully renamed ${resource} to ${newName}`);
      return this.delete(resource);
    });
  });
};
