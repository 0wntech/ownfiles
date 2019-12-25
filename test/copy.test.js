const expect = require("chai").expect;
const auth = require("solid-auth-cli");
const rdf = require("rdflib");
const url = require("url");
const PodClient = require("../lib/index.js");
const config = require("./podConfig.json");

const podClient = new PodClient({ podUrl: config.podUrl });

describe("Copy", function() {
  this.timeout(config.timeOut);
  before("Setting up auth...", async function() {
    const credentials = await auth.getCredentials();
    await auth.login(credentials);
    podClient.fetcher = new rdf.Fetcher(podClient.graph, {
      fetch: auth.fetch
    });
  });

  describe("copy()", function() {
    it("should copy the specified file to the location", async function() {
      const content = "Hello I am a text file.";
      await podClient.create(config.testFile, {
        contentType: "text/plain",
        contents: content
      });
      const copyLocation = url.resolve(config.podUrl, "profile") + "/";
      await podClient.copy(config.testFile.replace("ttl", "txt"), copyLocation);
      const file = await podClient.read(url.resolve(copyLocation, "test.txt"));
      expect(file).to.equal(content);
    });

    it("should copy the specified folder to the location", async function() {
      const folderLocation = config.testFolder;
      const nestedFile = url.resolve(config.testFolder, "testFile");
      const nestedFolder = url.resolve(folderLocation, "test") + "/";
      const deepNestedFile = url.resolve(nestedFolder, "testFile");

      await podClient.create(folderLocation);
      const content = "Hello I am a text file.";
      await podClient.create(nestedFile, {
        contentType: "text/plain",
        contents: content
      });

      await podClient.create(nestedFolder);
      await podClient.create(deepNestedFile, {
        contentType: "text/plain",
        contents: content
      });

      const copyLocation = url.resolve(config.podUrl, "/public");
      await podClient.copy(folderLocation, copyLocation);

      const copiedFolder = url.resolve(copyLocation, "test");
      const file = await podClient.read(
        url.resolve(copiedFolder + "/", "testFile.txt")
      );
      expect(file).to.equal(content);

      const copiedNestedFolder = url.resolve(copiedFolder + "/", "test");
      const file2 = await podClient.read(
        url.resolve(copiedNestedFolder + "/", "testFile.txt")
      );
      expect(file2).to.equal(content);
    });
  });

  afterEach("Cleaning up", async function() {
    return new Promise(async (resolve, reject) => {
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
      await Promise.all(cleanUps)
        .then(() => {
          resolve();
        })
        .catch(err => {
          reject(err);
        });
    });
  });
});
