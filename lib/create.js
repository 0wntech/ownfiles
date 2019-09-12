const url = require("url");

module.exports.createFolder = function(folderAddress) {
  if (!folderAddress) {
    throw new Error("Please specify the location for the new folder.");
  } else if (url.parse(folderAddress).protocol !== "https:"){
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
