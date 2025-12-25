import bcrypt from "bcryptjs";
import { Application, Request, Response } from "express";
import jwt from "jsonwebtoken";
import { register as metricsRegister } from 'prom-client';
import config from "./config";
import { logger } from "./logger";


const SECRET = config.auth.jwt_secret || "supersecret";


const hashPassword = async (password: string): Promise<string> => {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
};

const comparePassword = async (password: string, hash: string) => {
  return bcrypt.compare(password, hash);
};


const generateToken = (userId: string) => {
  return jwt.sign({ id: userId }, SECRET, { expiresIn: "1d" });
};

const verifyToken = (token: string) => {
  return jwt.verify(token, SECRET);
};


const metricsEndpoint = (app: Application) => {
  app.get('/metrics', async (req, res) => {
    res.set('Content-Type', metricsRegister.contentType);
    res.send(await metricsRegister.metrics());
  });
}

const healthCheck = (app: Application) => {
  app.get('/health', (req: Request, res: Response) => {
    logger.info('health_check', { uptime: process.uptime() });
    res.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
    });
  });
}


export default {
  jwt: {
    generateToken,
    verifyToken
  },
  hash: {
    hashPassword,
    comparePassword
  },
  metrics: {
    metricsEndpoint
  },
  healthCheck
}