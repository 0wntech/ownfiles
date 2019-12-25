const expect = require("chai").expect;
const FileClient = require("../index.js");

describe("FileClient", function() {
  describe("constructor()", function() {
    it("should instantiate without Error", function() {
      expect(() => {
        new FileClient({});
      }).to.not.throw(Error);
    });
  });
});
