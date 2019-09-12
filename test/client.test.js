const expect = require("chai").expect;
const User = require("ownuser");
const FileClient = require("../lib/index.js");
const config = require("./clientConfig.json");

describe("FileClient", function() {
  describe("constructor()", function() {
    it("should instantiate a new FileClient Object", function() {
      expect(new FileClient({ podUrl: config.podUrl }).of).to.equal(
        config.podUrl
      );
    });
    it("should instantiate a new FileClient Object with a Users webId", function() {
      expect(new FileClient({ User: new User(config.podUrl) }).of).to.equal(
        config.podUrl
      );
    });
    it("should throw an error when trying to instantiate without Pod Url", function() {
      expect(() => new FileClient({})).to.throw(Error);
    });
  });
});
