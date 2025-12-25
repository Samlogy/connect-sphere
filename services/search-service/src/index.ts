import express from "express";
import { app, bootstrap } from "./app";
import error from "./error";
import { logger } from "./logger";
import mid from "./middlewares";
import routes from "./routes";
import { register } from "./metrics";
// import utils from "./utils"


// Basic middleware (security)
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// metrics endpoint


// Health check
// error.healthCheck(app);

/* Routes */
routes.SearchServiceRoutes("/api/v1/search", app);

// ensure indices exist at startup

// metrics endpoint
// utils.metrics.metricsEndpoint(app)
app.get("/metrics", async (_, res) => {
  res.set("Content-Type", register.contentType);
  res.end(await register.metrics());
});

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