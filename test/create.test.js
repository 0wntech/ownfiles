const expect = require("chai").expect;
const auth = require("solid-auth-cli");
const rdf = require("rdflib");
const ns = require("solid-namespace")(rdf);
const PodClient = require("../lib/index.js");
const config = require("./podConfig.json");

const podClient = new PodClient({ podUrl: config.podUrl });

describe("Create", function() {
  before("Setting up auth...", async function() {
    this.timeout(5000);
    return new Promise(async (resolve, reject) => {
      const credentials = await auth.getCredentials();
      await auth.login(credentials);
      podClient.fetcher = new rdf.Fetcher(podClient.graph, {
        fetch: auth.fetch
      });
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
      await Promise.all(cleanUps).then(() => {
        resolve();
      }).catch((err) => {
        reject(err);
      });
    });
  });

  describe("create()", async function() {
    it("should create a folder at the specified url", async function() {
      const res = await podClient.create(config.testFolder);
      expect(res.status).to.equal(201);
    });

    it("should not create a folder if there is no specified url and throw an error instead", function() {
      expect(() => podClient.create()).to.throw(Error);
    });

    it("should not create a folder if there is an invalid url and throw an error instead", function() {
      expect(() =>
        podClient.create(config.testFolder.replace("https://", "lala://"))
      ).to.throw(Error);
    });

    it("should create a turtle file at the specified url with the turtle contents", async function() {
      const contents = [
        rdf.st(
          rdf.sym("https://lalasepp1.solid.community/profile/card#me"),
          ns.foaf("knows"),
          rdf.sym("https://ludwig.owntech.de/profile/card#me"),
          rdf.sym(config.testFile)
        )
      ];
      await podClient
        .create(config.testFile, {
          contents: contents
        })
        .then(() => {
          return podClient.fetcher.load(config.testFile).then(() => {
            const testTriples = podClient.graph.statementsMatching(
              rdf.sym("https://lalasepp1.solid.community/profile/card#me")
            );
            expect(testTriples).to.deep.equal(contents);
          });
        });
    });

    it("should create a plaintext file at the specified url with the contents", async function() {
      const res = await podClient.create(config.testFile, {
        contentType: "text/plain",
        contents: "Hello I am a text file."
      });
      await podClient.fetcher
        .load(config.testFile.replace("ttl", "txt"))
        .then(res => {
          expect(res.responseText).to.equal("Hello I am a text file.");
        });
    });
  });
});
