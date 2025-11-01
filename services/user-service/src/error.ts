import { Application, NextFunction, Request, Response } from "express";
import logger from "./logger";


const globalErrorHandler = (app: Application) => {
  app.use(
  (
    err: any,
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    logger.error('Unhandled error', {
      message: err.message,
      stack: err.stack,
      userAgent: req.headers['user-agent'],
      timestamp: new Date().toISOString(),
    });

    const statusCode = err.statusCode || 500;
    res.status(statusCode).json({
      success: false,
      message:
        process.env.NODE_ENV === 'prod'
          ? 'An error occurred'
          : err.message,
      ...(process.env.NODE_ENV !== 'prod' && { stack: err.stack }),
    });
  }
);
}

const NotFoundHandler = (app: Application) => {
  app.use('*', (req: Request, res: Response) => {
    logger.warn(`404 - Route not found: ${req.method} ${req.originalUrl}`, {
      ip: req.ip,
      userAgent: req.headers['user-agent']
    });
    
    res.status(404).json({
      success: false,
      message: 'Route not found'
    });
  });
}

const healthCheck = (app: Application) => {
  app.get('/health', (req: Request, res: Response) => {
  (req.log || logger).info('health_check', { uptime: process.uptime() });
  logger.info('Health check requested');
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});
}


export default {
  globalErrorHandler,
  NotFoundHandler,
  healthCheck
}