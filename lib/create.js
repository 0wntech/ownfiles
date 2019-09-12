const url = require("url");
const rdf = require("rdflib");
const mime = require("mime");

module.exports.createFolder = function(folderAddress) {
  if (!folderAddress) {
    throw new Error("Please specify the location for the new folder.");
  } else if (url.parse(folderAddress).protocol !== "https:") {
    throw new Error("Please specify a valid location for the new folder.");
  }
  const paths = folderAddress.split("/");

  let folderName = "";
  if (paths[paths.length - 1] === "/") {
    folderName = paths[paths.length - 1];
    paths.pop();
  } else {
    folderName = paths[paths.length - 2];
    paths.pop();
    paths.pop();
  }

  const request = {
    headers: {
      slug: folderName,
      link: '<http://www.w3.org/ns/ldp#BasicContainer>; rel="type"',
      "Content-Type": "text/turtle"
    }
  };

  return this.fetcher
    .webOperation("POST", paths.join("/"), request)
    .catch(err => {
      throw err;
    });
};

module.exports.createFile = function(fileAddress, options = {}) {
  if (!fileAddress) {
    throw new Error("Please specify the location for the new file.");
  } else if (!["https:", "http:"].includes(url.parse(fileAddress).protocol)) {
    throw new Error("Please specify a valid location for the new file.");
  }

  let body = "";
  if (options.contents) {
    if (Array.isArray(options.contents)) {
      if (
        options.contents.every(el => {
          return el.constructor.name === "Statement";
        })
      ) {
        options.contentType = "text/turtle";
        options.contents.forEach(st => {
          body += st.toNT() + "\n";
        });
      }
    } else if (typeof options.contents === 'string'){
      body = options.contents;
    }
  }

  options.contentType = mime.getExtension(options.contentType)
    ? options.contentType
    : "text/turtle";

  const paths = fileAddress.split("/");
  let fileName = "";
  if (paths[paths.length - 1] !== "") {
    fileName = paths[paths.length - 1];
    paths.pop();
  } else {
    fileName = paths[paths.length - 2];
    paths.pop();
    paths.pop();
  }

  const request = {
    headers: {
      slug: fileName.split(".")[0],
      link: '<http://www.w3.org/ns/ldp#Resource>; rel="type"'
    },
    contentType: options.contentType,
    body: body
  };

  return this.fetcher
    .webOperation("POST", paths.join("/") + "/", request)
    .catch(err => {
      throw err;
    });
};
