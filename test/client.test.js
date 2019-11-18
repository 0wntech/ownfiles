const expect = require("chai").expect;
const User = require("ownuser");
const FileClient = require("../index.js");
const config = require("./podConfig.json");

describe("FileClient", function() {
  describe("constructor()", function() {
    it("should instantiate without Error", function() {
      expect(() => {
        new FileClient({});
      }).to.not.throw(Error);
    });
  });
});
