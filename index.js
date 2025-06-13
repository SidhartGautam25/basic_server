const BasicServer = require("./lib/server.js");

function createServer(opts = {}) {
  const basic_server = new BasicServer(opts);

  // for extra config things
  return basic_server;
}

module.exports = createServer;
