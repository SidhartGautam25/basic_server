import { parse } from "regexparam";

const HTTP_METHODS = {
  GET: "GET",
  POST: "POST",
  PUT: "PUT",
  DELETE: "DELETE",
  OPTIONS: "OPTIONS",
  HEAD: "HEAD",
  USE: "USE",
};

const METHOD_PRIORITY = {
  [HTTP_METHODS.USE]: 0,
  [HTTP_METHODS.GET]: 1,
  [HTTP_METHODS.POST]: 2,
  [HTTP_METHODS.PUT]: 3,
  [HTTP_METHODS.DELETE]: 4,
  [HTTP_METHODS.OPTIONS]: 5,
  [HTTP_METHODS.HEAD]: 6,
};

class Route {
  constructor(method, path, handlers) {
    const { keys, pattern } = parse(path, method === HTTP_METHODS.USE);
    this.method = method;
    this.handlers = handlers;
    this.keys = keys;
    this.pattern = pattern;
    this.priority = METHOD_PRIORITY[method];
  }
  match(method, url) {
    // just return if method dont matches(except for middleware)
    if (this.method !== HTTP_METHODS.USE && this.method !== method) {
      return null;
    }
    const matches = this.pattern.exec(url);
    if (!matches) {
      return null;
    }
    const params = this.extractParams(matches);
    return {
      handlers: this.handlers,
      params,
    };
  }

  extractParams(matches) {
    if (!this.keys.length && !matches.groups) {
      return {};
    }
    const params = {};
    if (matches.groups) {
      Object.assign(params, matches.groups);
    }
    this.keys.forEach((key, i) => {
      params[key] = matches[i + 1];
    });
    return params;
  }
}

export class Router {
  constructor() {
    this.routes = [];
    this.initializeMethods();
  }
  initializeMethods() {
    Object.values(HTTP_METHODS).forEach((method) => {
      if (method === HTTP_METHODS.USE) {
        this.use = this.addRoute.bind(this, HTTP_METHODS.USE);
      } else {
        this[method.toLowerCase()] = this.addRoute.bind(this, method);
      }
    });
  }
  addRoute(method, path, ...handlers) {
    const route = new Route(method, path, handlers);
    this.routes.push(route);
    // sort routes by priority(middleware first,then the handlers)
    this.routes.sort((a, b) => a.priority - b.priority);
    return this;
  }

  find(method, url) {
    const result = {
      params: {},
      handlers: [],
    };
    for (const route of this.routes) {
      const match = route.match(method, url);
      if (!match) {
        continue;
      }
      Object.assign(result.params, match.params);
      result.handlers.push(...match.handlers);
    }
    return result;
  }
  // adding support for mounting
  mount(path, router) {
    router.routes.forEach((route) => {
      const mountedPath = path + (route.path === "/" ? "" : route.path);
      this.addRoute(route.method, mountedPath, ...route.handlers);
    });
    return this;
  }
}
