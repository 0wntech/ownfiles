const expect = require("chai").expect;
const auth = require("solid-auth-cli");
const rdf = require("rdflib");
const PodClient = require("../lib/index.js");
const config = require("./podConfig.json");

const podClient = new PodClient({ podUrl: config.podUrl });

describe("Delete", function() {
  before("Setting up auth...", async function() {
    this.timeout(config.timeOut);
    return new Promise(async (resolve, reject) => {
      const credentials = await auth.getCredentials();
      await auth.login(credentials);
      podClient.fetcher = new rdf.Fetcher(podClient.graph, {
        fetch: auth.fetch
      });
      const folder = await podClient.read(config.podUrl);
      console.log(folder);
      cleanUps = [];
      folder.folders.forEach(element => {
        if (!config.podContents.folders.includes(element)) {
          cleanUps.push(podClient.delete(element));
        }
      });
      folder.files.forEach(element => {
        if (!config.podContents.files.includes(element)) {
          cleanUps.push(podClient.delete(element));
        }
      });
      await Promise.all(cleanUps).then(() => {
        resolve();
      });
    });
  });

  describe("delete()", function() {
    it("should delete the specified file", async function() {
      await podClient.create(config.testFile);
      await podClient.delete(config.testFile).then(res => {
        expect(res.status).to.equal(200);
      });
    });
  });
});
