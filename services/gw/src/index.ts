import express from "express";
import { app, bootstrap } from "./app";
import error from "./error";
import { logger, logLevelSwitcher } from "./logger";
import mid from "./middlewares";
import utils from "./utils";
import config from "./config";

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

// Health check
utils.healthCheck(app);

// endpoint testing
app.get("/r1", (req: any, res) => {
  logger.info({
    message: "GW R1",
    requestId: req?.requestId,
    appName: config.app.app_name,
    api: req.originalUrl,
    method: req.method,
    originUrl: req.headers.origin || req.headers.referer || "",
    requestUrl: req.originalUrl,
    routeToUrl: `${process.env.SERVICE_URL || ""}${req.originalUrl}`,
    responseCode: 200,
  });

  res.json({ success: true });
});

app.get("/r2", (req: any, res) => {
  logger.info({
    message: "GW R2",
    requestId: req?.requestId,
    appName: config.app.app_name,
    api: req.originalUrl,
    method: req.method,
    originUrl: req.headers.origin || "",
    requestUrl: req.originalUrl,
    routeToUrl: `${process.env.SERVICE_URL || ""}${req.originalUrl}`,
    responseCode: 200,
  });

  res.json({ success: true });
});

/* Routes */
// => redirect traffic to services

// metrics endpoint
utils.metrics.metricsEndpoint(app)

// Global error handler
error.globalErrorHandler(app);

// Error handling middleware
mid.logging.errorMiddleware(app)

// start GW
bootstrap();

// 404 handler
// error.NotFoundHandler(app);



// Gracefull shutdown mecanism
process.on('unhandledRejection', (reason) => {
  logger.error('unhandled_rejection', { reason });
});

process.on('uncaughtException', (err) => {
  logger.error('uncaught_exception', { message: err.message, stack: err.stack });
  // optional: graceful shutdown
  process.exit(1);
});