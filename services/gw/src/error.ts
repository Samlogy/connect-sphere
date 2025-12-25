import { Application, NextFunction, Request, Response } from "express";
import config from "./config";
import { logger } from "./logger";


const globalErrorHandler = (app: Application) => {
  app.use(
    (
      err: any,
      req: Request,
      res: Response,
      next: NextFunction
    ) => {
      logger.error("Error: ", err);

      const statusCode = err.statusCode || 500;
      res.status(statusCode).json({
        success: false,
        message:
          config.app.node_envNODE_ENV === 'prod'
            ? 'An error occurred'
            : err.message,
        ...(config.app.node_envNODE_ENV !== 'prod' && { stack: err.stack }),
      });
    }
  );
}

const NotFoundHandler = (app: Application) => {
  app.use((req: Request, res: Response, next: NextFunction) => {
    logger.warn(`404 - Route not found: ${req.method} ${req.originalUrl}`, {
      ip: req.ip,
      userAgent: req.headers['user-agent']
    });

    res.status(404).json({
      success: false,
      message: 'Route not found'
    });

    next()
  });
}



export default {
  globalErrorHandler,
  NotFoundHandler,
}