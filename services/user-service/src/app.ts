import express from "express";
import { startRedis } from "./cache";
import config from "./config";
import db from "./db";
import logger from "./logger";


console.log(config)

const app = express();

async function startServer(port: number | string) {
  app.listen(port, () => {
    logger.info(`✅ User service => ${port}`, {
        port,
        environment: config.app.node_env || 'dev',
        nodeVersion: process.version
      })
  })
}

async function bootstrap() {
  const PORT = config.app.port || 4001;
  try {
    await db.sql;
    await startRedis();
    await startServer(PORT);
  } catch (err) {
    console.error('❌ Application failed to start: ', err);
    process.exit(1);
  }
}

export {
  app, bootstrap
};
