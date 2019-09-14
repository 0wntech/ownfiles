const rdf = require("rdflib");
const ns = require("solid-namespace")(rdf);
const url = require("url");

module.exports.read = function(resource) {
  const store = this.graph;
  const fetcher = this.fetcher;

  return fetcher.load(resource).then(res => {
    const containments = { folders: [], files: [] };
    if (store.holds(rdf.sym(resource), ns.rdf("type"), ns.ldp("BasicContainer"))) {
      store
        .each(rdf.sym(resource), ns.ldp("contains"), undefined)
        .map(result => {
          return result.value;
        })
        .forEach(result => {
          let resultFragments = url.parse(result).pathname.split("/");
          if (resultFragments[1] === "") {
            resultFragments.shift();
            result = result.replace(
              url.parse(result).pathname,
              resultFragments.join("/")
            );
            resultFragments = url.parse(result).pathname.split("/");
          }
          if (resultFragments[resultFragments.length - 1] === "") {
            containments.folders.push(result);
          } else {
            containments.files.push(result);
          }
        });
      return containments;
    } else {
      return res.responseText;
    }
  });
};
