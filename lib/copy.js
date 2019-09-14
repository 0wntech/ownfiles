const url = require("url");
const mime = require("mime");

module.exports.copy = function(resource, location) {
  if (resource) {
    if (location) {
      copyFolder = copyFolder.bind(this);
      copyFile = copyFile.bind(this);
      if (resource.endsWith("/")) {
        return copyFolder(resource, location);
      } else {
        return copyFile(resource, location);
      }
    }
  }
};

function copyFile(resource, location) {
  return this.read(resource).then(content => {
    const options = {};
    options.name = resource.substr(resource.lastIndexOf("/") + 1);

    options.contentType = mime.getType(mime.getExtension(options.contentType));
    options.contentType = options.contentType
      ? options.contentType
      : mime.getType(options.name);
    options.contentType = options.contentType
      ? options.contentType
      : "text/turtle";
    options.contents = content;

    return this.create(url.resolve(location, options.name), options);
  });
}

function copyFolder(resource, location) {
  return Promise.resolve("Tbd");
}
