import express, { Application, NextFunction } from "express";
import { app, bootstrap } from "./app";
import error from "./error";
import { logger, logLevelSwitcher } from "./logger";
import mid from "./middlewares";
import services from "./routes";
import config from "./config";
import utils from "./utils"
import { apdexSatisfied, apdexTolerating, apdexFrustrated, httpRequestDuration } from "./metrics"

// Basic middleware (security)
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// metrics endpoint
mid.metrics.metricMiddleware(app)

// Log all requests
mid.logging.requestIdMiddleware(app)
mid.logging.logMiddleware(app)

// Log Level Switcher
logLevelSwitcher(app);

// CORS setup
mid.security.corsPolicy(app);

// middleware apdex
const T_THRESHOLDS: {[route: string]: number} = {
  '/api/users/register': 0.3,   // 300ms
  '/api/users/login': 0.2,
  '/r1': .2, // 200mx
  '/r2': .25 // 250mx
};

const apdexMiddleware = (app: Application) => {
  return async (req: any, res: any, next: NextFunction) => {
    const route = req.route?.path || req.path;
    const T = T_THRESHOLDS[route] || 0.5;  // default 500ms
    const endTimer = httpRequestDuration.startTimer({ method: req.method, route, status: '' });
    const start = Date.now();

    console.log(route, T, endTimer, start)

    res.on('finish', () => {
      const status = res.statusCode.toString();
      const latency = (Date.now() - start) / 1000; // seconds
      endTimer({ method: req.method, route, status });

      if (res.statusCode >= 500) {
        apdexFrustrated.inc({ route });
      } else {
        if (latency <= T) {
          apdexSatisfied.inc({ route });
        } else if (latency <= 4 * T) {
          apdexTolerating.inc({ route });
        } else {
          apdexFrustrated.inc({ route });
        }
      }
    });

    next();
  }
}
apdexMiddleware(app)

// Health check
error.healthCheck(app);

// endpoint testing
// app.get("/r1", (req: any, res) => {
//   logger.info({
//     message: "User Service R1",
//     requestId: req?.requestId,
//     appName: config.app.app_name,
//     api: req.originalUrl,
//     method: req.method,
//     originUrl: req.headers.origin || req.headers.referer || "",
//     requestUrl: req.originalUrl,
//     routeToUrl: `${process.env.SERVICE_URL || ""}${req.originalUrl}`,
//     responseCode: 200,
//   });

//   res.json({ success: true });
// });

// app.get("/r2", (req: any, res) => {
//   logger.info({
//     message: "User Service R2",
//     requestId: req?.requestId,
//     appName: config.app.app_name,
//     api: req.originalUrl,
//     method: req.method,
//     originUrl: req.headers.origin || "",
//     requestUrl: req.originalUrl,
//     routeToUrl: `${process.env.SERVICE_URL || ""}${req.originalUrl}`,
//     responseCode: 200,
//   });

//   res.json({ success: true });
// });

/* Routes */
services.UserServiceRoutes("/api/v1/users", app);

// metrics endpoint
utils.metrics.metricsEndpoint(app)

// Global error handler
error.globalErrorHandler(app);

// Error handling middleware
mid.logging.errorMiddleware(app)

// start user service
bootstrap();

// 404 handler
error.NotFoundHandler(app);



// Gracefull shutdown mecanism
process.on('unhandledRejection', (reason) => {
  logger.error('unhandled_rejection', { reason });
});

process.on('uncaughtException', (err) => {
  logger.error('uncaught_exception', { message: err.message, stack: err.stack });
  // optional: graceful shutdown
  process.exit(1);
});