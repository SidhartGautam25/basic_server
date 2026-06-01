import { createRequestHandler } from "./final-handler.js";
import { Router } from "./router.js";
import http from "http";
import { errorOccured } from "./utils/errorOccured.js";
import { nothingMatches } from "./utils/whenNothingMatches.js";

export class BasicServer {
  constructor(opts = {}) {
    this.noMatches = opts.noMatches || nothingMatches;
    this.error = opts.error || errorOccured;
    this.router = new Router();
    this.runsOnEveryRequest = createRequestHandler(this);
    this._initializeMethods();
  }

  _initializeMethods() {
    const methods = ["get", "post", "put", "delete", "options", "head"];
    methods.forEach((method) => {
      this[method] = (path, ...handlers) => {
        this.router[method](path, ...handlers);
        return this;
      };
    });
  }

  addMiddleware(base, ...fns) {
    if (typeof base === "function") {
      this.router.use("/", base, ...fns);
    } else {
      this.router.use(base, ...fns);
    }
    return this;
  }

  use(base, ...fns) {
    return this.addMiddleware(base, ...fns);
  }

  runServerOn(port, callback) {
    if (!this.server) {
      this.server = http.createServer();
      this.server.on("request", this.runsOnEveryRequest);
    }

    this.server.listen(port, callback);
    return this;
  }
}
