import { decorateRequest, decorateResponse } from "./utils/decorate.js";
import { getBase } from "./utils/getBase.js";
import { parser } from "./utils/parser.js";

export function createRequestHandler(server, logger = console) {
  function prepareContext(req, res, extra) {
    if (!extra) {
      extra = parser(req);
    }
    decorateRequest(req, extra);
    decorateResponse(res);

    return {
      req,
      res,
      base: getBase(req.path),
      path: req.path,
      method: req.method,
    };
  }

  function buildMiddleware(context) {
    const routeHandlers = server.router.find(context.method, context.path) || {
      handlers: [],
      params: {},
    };
    context.req.params = routeHandlers.params || {};

    return [
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
