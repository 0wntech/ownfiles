const expect = require("chai").expect;
const auth = require("solid-auth-cli");
const rdf = require("rdflib");
const url = require("url");
const PodClient = require("../lib/index.js");
const config = require("./podConfig.json");

const podClient = new PodClient({ podUrl: config.podUrl });

describe("Copy", function() {
  before("Setting up auth...", async function() {
    this.timeout(5000);
    const credentials = await auth.getCredentials();
    await auth.login(credentials);
    podClient.fetcher = new rdf.Fetcher(podClient.graph, {
      fetch: auth.fetch
    });
  });

  after("Clean up...", async function() {
    const folder = await podClient.read(config.podUrl);
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
    await Promise.all(cleanUps);
  });

  describe("copy()", function() {
    it("should copy the specified resource to the location", async function() {
      const content = "Hello I am a text file.";
      await podClient.create(config.testFile, {
        contentType: "text/plain",
        contents: content
      });
      const copyLocation = url.resolve(config.podUrl, "profile");
      await podClient.copy(config.testFile.replace("ttl", "txt"), config.podUrl);
      const file = await podClient.read(url.resolve(copyLocation, "test.txt"));
      expect(file).to.equal(content);
    });
  });
});
