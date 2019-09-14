const rdf = require("rdflib");
const ns = require("solid-namespace")(rdf);

module.exports.delete = function(items) {
  if (items) {
    deleteRecursively = deleteRecursively.bind(this);
    if (Array.isArray(items)) {
      items.map(item => {
        return deleteRecursively(item);
      });
      return Promise.all(items);
    } else {
      return deleteRecursively(items);
    }
  } else {
    throw new Error("Please specify the item/items you would like to delete.");
  }
};

function deleteRecursively(url) {
  return new Promise(
    function(resolve, reject) {
      const store = this.graph;
      const fetcher = this.fetcher;
      fetcher.load(url).then(function() {
        const promises = store
          .each(rdf.sym(url), ns.ldp("contains"))
          .map(file => {
            if (store.holds(file, ns.rdf("type"), ns.ldp("BasicContainer"))) {
              return deleteRecursively(file.uri);
            } else {
              return fetcher.webOperation("DELETE", file.uri);
            }
          });
        Promise.all(promises)
          .then(() => {
            fetcher
              .webOperation("DELETE", url)
              .then(res => {
                resolve(res);
              })
              .catch(err => {
                reject(err);
              });
          })
          .catch(err => {
            reject(err);
          });
      });
    }.bind(this)
  );
}
