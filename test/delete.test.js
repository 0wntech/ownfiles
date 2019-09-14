const expect = require("chai").expect;
const auth = require("solid-auth-cli");
const rdf = require("rdflib");
const FileClient = require("../lib/index.js");
const config = require("./clientConfig.json");

const fileClient = new FileClient({ podUrl: config.podUrl });

describe("Delete", function() {
  before("Setting up auth...", async function() {
    this.timeout(5000);
    const credentials = await auth.getCredentials();
    await auth.login(credentials);
    fileClient.fetcher = new rdf.Fetcher(fileClient.graph, {
      fetch: auth.fetch
    });
  });

  describe("delete()", function() {
    it("should delete the specified file", async function() {
      fileClient.delete(config.testFile).then(res => {
        expect(res.status).to.equal(200);
      });
    });
  });
});
