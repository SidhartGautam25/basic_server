import { BasicServer } from "./lib/server.js";
import { json, urlencoded } from "./lib/utils/bodyParser.js";

export function createServer(opts = {}) {
  const basic_server = new BasicServer(opts);
  return basic_server;
}

export { json, urlencoded };
