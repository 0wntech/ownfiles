const expect = require("chai").expect;
const auth = require("solid-auth-cli");
const rdf = require("rdflib");
const PodClient = require("../lib/index.js");
const config = require("./podConfig.json");

const podClient = new PodClient({ podUrl: config.podUrl });

describe("Delete", function() {
  before("Setting up auth...", async function() {
    this.timeout(5000);
    const credentials = await auth.getCredentials();
    await auth.login(credentials);
    podClient.fetcher = new rdf.Fetcher(podClient.graph, {
      fetch: auth.fetch
    });
  });

  describe("delete()", function() {
    it("should delete the specified file", async function() {
      podClient.delete(config.testFile).then(res => {
        expect(res.status).to.equal(200);
      });
    });
  });
});
