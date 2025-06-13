import { BasicServer } from "./lib/server.js";

export function createServer(opts = {}) {
  const basic_server = new BasicServer(opts);

  // for extra config things
  return basic_server;
}
