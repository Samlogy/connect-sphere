import dotenv from "dotenv";
import express, { Application, Request, Response } from "express";
import { bootstrap, app } from "./app";
import logger from "./logger";
import mid from "./middlewares";
import services from "./routes";
import error from "./error";


// Log all requests
app.use(mid.logging.requestIdMiddleware);
app.use(mid.logging.requestLogger);

// Basic middleware (security)
mid.security.securityMiddleware(app)

// CORS setup
mid.security.corsPolicy(app);

/* Routes */
// services.UserServiceRoutes(app);



// Health check
error.healthCheck(app);

// Global error handler
error.globalErrorHandler(app);

// start user service
bootstrap();

// 404 handler
// error.NotFoundHandler(app);





process.on('unhandledRejection', (reason) => {
  logger.error('unhandled_rejection', { reason });
});

process.on('uncaughtException', (err) => {
  logger.error('uncaught_exception', { message: err.message, stack: err.stack });
  // optional: graceful shutdown
  process.exit(1);
});