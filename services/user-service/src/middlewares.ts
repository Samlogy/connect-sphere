import cors from "cors";
import express, { Application, NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import { v4 as uuidv4 } from 'uuid';
import { REDACT_FIELDS, redact } from './logger';
import logger from "./logger"
import config from "./config";

// Middleware Auth
const authenticate = (req: any, res: Response, next: NextFunction) => {
  const header = req.headers.authorization;
  if (!header) return res.status(401).json({ error: "No token provided" });

  const token = header.split(" ")[1];
  try {
    const decoded = jwt.verify(token, config.auth.jwt_secret);
    req.user = decoded;
    next();
  } catch {
    return res.status(401).json({ error: "Invalid token" });
  }
};

// Middleware Security
const allowedOrigins = ['http://localhost:5176', 'http://yourapp.com']
const allowedMethods = ['GET', 'POST', 'DELETE', 'PUT', 'PATCH']
const allowedHeaders = ['Content-Type', 'Authorization']
const corsPolicy = (app: Application) => {
  const corsPolicy = cors({
      origin: (origin, callback) => {
        if (!origin) return callback(null, true)
        if (allowedOrigins.indexOf(origin) === -1) {
          const msg = 'The CORS policy for this site does not ' + 'allow access from the specified Origin.'
          return callback(new Error(msg), false)
        }
        return callback(null, true)
      },
      methods: allowedMethods,
      allowedHeaders,
      // credentials: true, // enable HTTP cookies
      // optionsSuccessStatus: 200
    })
  app.use(corsPolicy)
}

declare global {
  namespace Express {
    interface Request {
      requestId?: string;
      log?: any;
    }
  }
}

// Middleware Logging
const requestIdMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const id = req.headers['x-request-id'] as string || uuidv4();
  req.requestId = id;
  res.setHeader('x-request-id', id);

  // create a child logger that will automatically include requestId + route
  req.log = logger.child({ requestId: id, route: req.originalUrl, method: req.method });
  next();
}

const  requestLogger = (req: Request, res: Response, next: NextFunction) => {
  const start = Date.now();
  const { method, originalUrl, ip } = req;
  const log = req.log || console;
  const requestId = uuidv4();

  // Sauvegarder dans la requête pour usage ultérieur
  req.requestId = requestId;

  // Log basic incoming request (redacted)
  log.info('incoming_request', {
    method,
    url: originalUrl,
    ip,
    headers: redact(req.headers, REDACT_FIELDS),
    body: redact(req.body, REDACT_FIELDS),
    query: redact(req.query, REDACT_FIELDS)
  });

  // hook to log response once finished
  res.on('finish', () => {
    const duration = Date.now() - start;
    
    log.info('request_completed', {
      message: 'API request processed',
      requestId,
      appName: process.env.APP_NAME || 'user-service',
      api: req.baseUrl || req.originalUrl,
      method: req.method,
      response_code: res.statusCode,
      originUrl: req.headers.origin || 'unknown',
      requestUrl: req.originalUrl,
      routeToUrl: `${req.protocol}://${req.get('host')}${req.originalUrl}`,
      durationMs: duration,
      userAgent: req.headers['user-agent']
    });
  });

  next();
}

// Middleware Error Logging
const errorHandler = (err: any, req: Request, res: Response, next: NextFunction) => {
  const status = err.statusCode || 500;
  const log = req.log || logger;

  log.error('unhandled_error', {
    message: err.message,
    stack: err.stack,
    route: req.originalUrl,
    method: req.method,
    requestId: req.requestId
  });

  const payload: any = {
    success: false,
    message: process.env.NODE_ENV === 'prod' ? 'Internal Server Error' : err.message,
    requestId: req.requestId
  };

  if (process.env.NODE_ENV !== 'prod') {
    payload.stack = err.stack;
  }

  res.status(status).json(payload);
}


export default {
    auth: {
        authenticate
    },
    security: {
      corsPolicy,
    },
    logging: {
      requestIdMiddleware,
      requestLogger,
      errorHandler
    }
}