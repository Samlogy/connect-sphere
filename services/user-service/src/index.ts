import express from "express";
import { app, bootstrap } from "./app";
import error from "./error";
import logger from "./logger";
import mid from "./middlewares";
import services from "./routes";


// Log all requests
app.use(mid.logging.requestIdMiddleware);
app.use(mid.logging.requestLogger);

// Basic middleware (security)
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get('/r1', (req, res) => res.json({ message: 'User Service R1' }));
app.get('/r2', (req, res) => res.json({ message: 'User Service R2' }));

// CORS setup
mid.security.corsPolicy(app);

// Health check
error.healthCheck(app);

/* Routes */
services.UserServiceRoutes("/api/v1/users", app);


// Global error handler
error.globalErrorHandler(app);

// start user service
bootstrap();

// 404 handler
error.NotFoundHandler(app);






process.on('unhandledRejection', (reason) => {
  logger.error('unhandled_rejection', { reason });
});

process.on('uncaughtException', (err) => {
  logger.error('uncaught_exception', { message: err.message, stack: err.stack });
  // optional: graceful shutdown
  process.exit(1);
});