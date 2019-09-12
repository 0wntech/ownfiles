const expect = require("chai").expect;
const auth = require("solid-auth-cli");
const rdf = require("rdflib");
const FileClient = require("../lib/index.js");
const config = require("./clientConfig.json");

const fileClient = new FileClient({ podUrl: config.podUrl });

describe("Create", function() {
  before("Setting up auth...", async function() {
    this.timeout(5000);
    const credentials = await auth.getCredentials();
    await auth.login(credentials);
    fileClient.fetcher = new rdf.Fetcher(fileClient.graph, {
      fetch: auth.fetch
    });
  });

  describe("createFolder()", function() {
    it("should create a folder at the specified url", async function() {
      fileClient.createFolder(config.testFolder).then(res => {
        expect(res.status).to.equal(201);
      });
    });
    it("should not create a folder if there is no specified url and throw an error instead", function() {
      expect(() => fileClient.createFolder()).to.throw(Error);
    });
    it("should not create a folder if there is an invalid url and throw an error instead", function() {
      expect(() =>
        fileClient.createFolder(
          config.testFolder.replace("https://", "lala://")
        )
      ).to.throw(Error);
    });
  });
});
