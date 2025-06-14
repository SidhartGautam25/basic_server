import { getBase } from "./utils/getBase.js";
import { parser } from "./utils/parser.js";
import { parse } from "querystring";

export function createRequestHandler(server, logger = console) {
  function prepareContext(req, res, extra) {
    if (!extra) {
      extra = parser(req);
    }
    req.completeURL = req.originalUrl || req.url;
    req.path = extra.pathname;
    req.query = parse(extra.query);
    return {
      req,
      res,
      base: getBase(req.path),
      path: req.path,
      method: req.method,
    };
  }
  function buildMiddleware(context) {
    const { base } = context;
    const global_middlewares = server.middleware.global_middlewares || [];
    const base_middlewares = server.middleware.middlewares[base] || [];
    const routeHandlers = server.router.find(context.method, context.path) || {
      handlers: [],
    };
    context.req.params = routeHandlers.params || {};
    if (
      !routeHandlers.handlers.length &&
      server.middleware.sub_applications[base]
    ) {
      // Sub-application handling would go here
    }
    return [
      ...global_middlewares,
      ...base_middlewares,
      ...routeHandlers.handlers,
      server.noMatches.bind(server),
    ];
  }

  function executeChain(middlewares, context) {
    const { req, res } = context;
    let index = 0;

    const next = (err) => {
      if (err) {
        return server.error(err, req, res, next);
      }
      if (index >= middlewares.length) {
        return;
      }
      const middleware = middlewares[index++];
      try {
        middleware(req, res, next);
      } catch (err) {
        next(err);
      }
    };

    return next();
  }

  return function handleRequest(req, res, extra) {
    try {
      const context = prepareContext(req, res, extra);
      const middlewares = buildMiddleware(context);
      executeChain(middlewares, context);
    } catch (err) {
      logger.error("Request failed ", err);
      res.statusCode = 500;
      res.end("Internal Server Error");
    }
  };
}
