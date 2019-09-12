const url = require("url");

function FileClient({ podUrl = undefined, User = undefined }) {
  if (User) {
    if (User.webId) {
      this.of = User.webId.replace("profile/card#me");
    } else {
      throw new Error("The specified User doesn't have a webId.");
    }
  } else if (podUrl) {
    const parsedPodUrl = url.parse(podUrl);
    if (parsedPodUrl.protocol && parsedPodUrl.host) {
      this.of = podUrl;
    } else {
      throw new Error("Please enter a valid webId.");
    }
  } else {
    throw new Error("Please specify the url of the pod you want to modify.");
  }
}

module.exports = FileClient;
