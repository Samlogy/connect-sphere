import { Request, Response, NextFunction, Application } from "express";
import { v4 as uuidv4 } from "uuid";
import winston from "winston";
import os from "os";
import config from "./config"


const logConfig = {
  defaults: {
    int: "info",
    qua: "info",
    prod: "error",
  } as Record<string, string>,

  getLevel(env: string): string {
    return this.defaults[env] || "info";
  },

  overrideLevel: null as string | null,

  getEffectiveLevel(env: string): string {
    return this.overrideLevel || this.getLevel(env);
  },
};

const env = config.app.node_env

const logger = winston.createLogger({
  level: logConfig.getEffectiveLevel(env),
  defaultMeta: {
    appName: config.app.app_name,
    environment: env,
    hostname: os.hostname(),
    version: config.app.app_version,
  },
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [new winston.transports.Console()],
});


const setLogLevel = (level: string): void => {
  logger.level = level;
  logConfig.overrideLevel = level;
  logger.info(`Log level changed to ${level}`);
}

const logLevelSwitcher = (app: Application) => {
  app.post("/api/log-level", (req: any, res: any) => {
    const { level } = req.body;
    if (level) {
      setLogLevel(level);
      res.json({ message: `Log level changed to ${level}` });
    } else {
      res.status(400).json({ error: "Missing log level" });
    }
  });
}


export {
  logger,
  setLogLevel,
  logLevelSwitcher
}