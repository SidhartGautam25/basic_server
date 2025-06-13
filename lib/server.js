import { createRequestHandler } from "./final-handler.js";
import { Router } from "./router.js";
import http from "http";
import { errorOccured } from "./utils/errorOccured.js";
import { nothingMatches } from "./utils/whenNothingMatches.js";

class Middleware {
  // logic
  constructor() {
    // initialization
    this.global_middlewares = [];
    this.middlewares = {};
    this.sub_applications = {};
  }

  // need to work on this
  add(base, ...fns) {
    if (typeof base === "function") {
      this.global_middlewares = this.global_middlewares.concat(base, fns);
    } else if (base === "/") {
      this.global_middlewares = this.global_middlewares.concat(fns);
    } else {
      base = this._ensureLeadingSlash(base);
      for (const fn of fns) {
        if (fn instanceof BasicServer) {
          this.sub_applications[base] = fn;
        } else {
          this.middlewares[base] = this.middlewares[base] || [];
          this.middlewares[base].push(fn);
        }
      }
    }
    return this;
  }
  getMiddlewareForBase(base) {
    return this.middlewares[base] || [];
  }
  getGlobalMiddlewares() {
    return this.global_middlewares;
  }
  _ensureLeadingSlash(path) {
    return path.startsWith("/") ? path : "/" + path;
  }
}

export class BasicServer {
  constructor(opts = {}) {
    this.middleware = new Middleware();
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
    this.middleware.add(base, ...fns);
    return this;
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
