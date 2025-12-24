import express, { Application, NextFunction, Request, Response } from "express";
import { v4 as uuidv4 } from 'uuid';
import { logger } from "./logger"
import config from "./config";
import { httpRequestDuration, httpRequestsTotal } from './metrics';
import { app } from "./app";

export interface LogEntry {
  message: string;
  stack?: string;
  requestId: string;
  appName: string;
  api: string;
  method: string;
  originUrl: string;
  requestUrl: string;
  routeToUrl: string;
  responseCode: number;
  latency?: number;
}


// trace log => requestId
const requestIdMiddleware = (app: Application) => {
  app.use((req: any, res: Response, next: NextFunction) => {
    const id = req.headers['x-request-id'] as string || uuidv4();
    req.requestId = id;
    res.setHeader('x-request-id', id);

    next();
  })
}

// log every Request
const logMiddleware = (app: Application) => {
  app.use((req: any, res: Response, next: NextFunction): void => {
    const start = Date.now();

    res.on("finish", () => {
      const logEntry: LogEntry = {
        message: "HTTP Request",
        requestId: req.requestId,
        appName: config.app.app_name,
        api: req.originalUrl,
        method: req.method,
        originUrl: req.headers.origin || req.headers.referer || "",
        requestUrl: req.originalUrl,
        routeToUrl: `${process.env.SERVICE_URL || ""}${req.originalUrl}`,
        responseCode: res.statusCode,
        latency: Date.now() - start,
      };

      if (res.statusCode >= 500) {
        logger.error(logEntry);
      } else if (res.statusCode >= 400) {
        logger.warn(logEntry);
      } else {
        logger.info(logEntry);
      }
    });

    next();
  })
}

// error Middleware
const errorMiddleware = (app: Application) => {
  app.use((err: any, req: any, res: Response, next: NextFunction): void => {
    const logEntry: LogEntry = {
      message: err.message || "Internal Server Error",
      stack: err.stack,
      requestId: req.requestId || uuidv4(),
      appName: config.app.app_name,
      api: req.originalUrl || "",
      method: req.method || "",
      originUrl: req.headers.origin || req.headers.referer || "",
      requestUrl: req.originalUrl || "",
      routeToUrl: `${config.app.service_url}/${req.originalUrl}`,
      responseCode: res.statusCode || 500,
    };

    logger.error(logEntry);
    res.status(500).json({ error: "Internal server error" });
  })
}

// Metrics Middleware
const metricMiddleware = (app: Application) => {
  app.use((req, res, next) => {
    const route = req.route?.path || req.path;
    const method = req.method;
    const end = httpRequestDuration.startTimer({ method, route, status: '' });
    res.on('finish', () => {
      const status = res.statusCode.toString();
      httpRequestsTotal.inc({ method, route, status });
      end({ method, route, status });
    });
    next();
  });
}



export default {
  logging: {
    requestIdMiddleware,
    logMiddleware,
    errorMiddleware,
  },
  metrics: {
    metricMiddleware
  }
}