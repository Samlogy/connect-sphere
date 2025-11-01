import dotenv from "dotenv";
import express from "express";
import logger from "./logger";
import mid from "./middlewares";
import services from "./routes";
import { startRedis } from "./cache";
import db from "./db";

dotenv.config();
const app = express();

async function startServer(port: number | string) {
  app.listen(port, () => {
    logger.info(`✅ User service => ${port}`, {
        port,
        environment: process.env.NODE_ENV || 'dev',
        nodeVersion: process.version
      })
  })
}

async function bootstrap() {
  const PORT = process.env.PORT || 4001;
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
  bootstrap,
  app
}