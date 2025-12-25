import express from "express";
import config from "./config";
import db from "./db";
import { logger } from "./logger";

const app = express();

async function startServer(port: number | string) {
  app.listen(port, () => {
    logger.info(`✅ GW => ${port}`, {
      port,
      environment: config.app.node_env || 'local',
      nodeVersion: process.version
    })
  })
}

async function bootstrap() {
  try {
    await db.sql;
    await startServer(config.app.port);
  } catch (err) {
    console.error('❌ Application failed to start: ', err);
    process.exit(1);
  }
}

export {
  app, bootstrap
};
