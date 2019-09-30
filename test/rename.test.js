const expect = require("chai").expect;
const auth = require("solid-auth-cli");
const rdf = require("rdflib");
const url = require("url");
const PodClient = require("../lib/index.js");
const config = require("./podConfig.json");

const podClient = new PodClient({ podUrl: config.podUrl });

describe("Rename", function() {
  before("Setting up auth...", async function() {
    this.timeout(config.timeOut);
    const credentials = await auth.getCredentials();
    await auth.login(credentials);
    podClient.fetcher = new rdf.Fetcher(podClient.graph, {
      fetch: auth.fetch
    });
  });

  after("Cleaning up", async function() {
    return new Promise(async (resolve, reject) => {
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
      await Promise.all(cleanUps)
        .then(() => {
          resolve();
        })
        .catch(err => {
          reject(err);
        });
    });
  });

  describe("rename()", function() {
    it("should rename the specified file", async function() {
      const content = "Hello I am a text file.";
      await podClient.create(config.testFile, {
        contentType: "text/plain",
        contents: content
      });
      const newName = "test2";
      const filePath = config.testFile.replace("ttl", "txt");
      await podClient.renameFile(filePath, newName);
      const file = await podClient.read(
        filePath.replace("test.txt", "test2.txt")
      );
      expect(file).to.equal(content);
    });

    it("should rename the specified folder", async function() {
      this.timeout(5000);
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

      const newName = "test2";
      await podClient.renameFolder(folderLocation, newName);

      const renamedFolder = folderLocation.replace("test", "test2");
      console.log(renamedFolder);
      const file = await podClient.read(
        url.resolve(renamedFolder, "testFile.txt")
      );
      expect(file).to.equal(content);

      const renamedNestedFolder = url.resolve(renamedFolder, "test");
      console.log(renamedNestedFolder);
      const file2 = await podClient.read(
        url.resolve(renamedNestedFolder + "/", "testFile.txt")
      );
      expect(file2).to.equal(content);
    });
  });
});
