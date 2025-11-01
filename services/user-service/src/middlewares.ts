import cors from "cors";
import express, { Application, NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import { v4 as uuidv4 } from 'uuid';
import { REDACT_FIELDS, redact } from './logger';
import logger from "./logger"

const authenticate = (req: any, res: Response, next: NextFunction) => {
  const header = req.headers.authorization;
  if (!header) return res.status(401).json({ error: "No token provided" });

  const token = header.split(" ")[1];
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!);
    req.user = decoded;
    next();
  } catch {
    return res.status(401).json({ error: "Invalid token" });
  }
};

const corsPolicy = (app: Application) => {
  const corsOptions = {
    origin: process.env.ALLOWED_ORIGINS?.split(',') || '*',
    methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  };
  app.use(cors(corsOptions));
}

const securityMiddleware = (app: Application) => {
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ limit: '10mb', extended: true }));
}

declare global {
  namespace Express {
    interface Request {
      requestId?: string;
      log?: any;
    }
  }
}

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
      method,
      url: originalUrl,
      statusCode: res.statusCode,
      durationMs: duration,
      responseHeaders: res.getHeaders()
    });
  });

  next();
}

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
      securityMiddleware
    },
    logging: {
      requestIdMiddleware,
      requestLogger,
      errorHandler
    }
}