import express from "express";
import { app, bootstrap } from "./app";
import error from "./error";
import { logger, logLevelSwitcher } from "./logger";
import mid from "./middlewares";
import services from "./routes";
import config from "./config";


// Log all requests
app.use(mid.logging.requestIdMiddleware)
app.use(mid.logging.logMiddleware)

// Log Level Switcher
logLevelSwitcher(app);


// Basic middleware (security)
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get("/r1", (req: any, res) => {
  logger.info({
    message: "User Service R1",
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
    message: "User Service R2",
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

// CORS setup
mid.security.corsPolicy(app);

// Health check
error.healthCheck(app);

/* Routes */
services.UserServiceRoutes("/api/v1/users", app);


// Global error handler
error.globalErrorHandler(app);

// Error handling middleware
app.use(mid.logging.errorMiddleware);

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