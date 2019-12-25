const url = require("url");
const mime = require("mime");

module.exports.create = function(resourceAddress, options = {}) {
  if (!resourceAddress) {
    throw new Error("Please specify the location for the new resource.");
  } else if (url.parse(resourceAddress).protocol !== "https:") {
    throw new Error("Please specify a valid location for the new resource.");
  }

  createFolder = createFolder.bind(this);
  createFile = createFile.bind(this);

  const paths = resourceAddress.split("/");
  if(!options.name){
    if (paths[paths.length - 1] !== "") {
      options.name = paths[paths.length - 1];
      paths.pop();
      return createFile(paths.join("/") + "/", options);
    } else {
      options.name = paths[paths.length - 2];
      paths.pop();
      paths.pop();
      return createFolder(paths.join("/") + "/", options);
    }
  } else if (resourceAddress.endsWith('/')) {
    paths.pop();
    paths.pop();
    return createFolder(paths.join("/") + "/", options);
  } else {
    paths.pop();
    return createFile(paths.join("/") + "/", options);
  }
};

function createFolder(folderAddress, options) {
  const request = {
    headers: {
      slug: options.name,
      link: '<http://www.w3.org/ns/ldp#BasicContainer>; rel="type"',
      "Content-Type": "text/turtle"
    }
  };

  return this.fetcher
    .webOperation("POST", folderAddress, request)
    .catch(err => {
      throw err;
    });
}

function createFile(fileAddress, options = {}) {
  const body = bodyFromContent(options.contents);

  options.contentType = mime.getType(mime.getExtension(options.contentType));
  options.contentType = options.contentType
    ? options.contentType
    : mime.getType(options.name);
  options.contentType = options.contentType
    ? options.contentType
    : "text/turtle";

  const request = {
    headers: {
      slug: options.name.split(".")[0],
      link: '<http://www.w3.org/ns/ldp#Resource>; rel="type"'
    },
    contentType: options.contentType,
    body: body
  };

  return this.fetcher.webOperation("POST", fileAddress, request).catch(err => {
    throw err;
  });
}

function bodyFromContent(content) {
  if (content) {
    if (Array.isArray(content)) {
      if (
        content.every(el => {
          return el.constructor.name === "Statement";
        })
      ) {
        let bodyString = "";
        content.forEach(st => {
          bodyString += st.toNT() + "\n";
        });
        return bodyString;
      }
    } else {
      return content;
    }
  } else {
    return "";
  }
}
