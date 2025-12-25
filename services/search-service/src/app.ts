import express from "express";
import { startConsumer } from "./broker";
import config from "./config";
import { logger } from "./logger";
import { initRessourceIndex } from "./elastic";

const app = express();



async function startServer(port: number | string) {
  app.listen(port, () => {
    logger.info(`✅ Search service => ${port}`, {
      port,
      environment: config.app.node_env || 'dev',
      nodeVersion: process.version
    })
  })
}

async function bootstrap() {
  const PORT = config.app.port;
  try {
    await initRessourceIndex("posts");
    await startServer(PORT);
    await startConsumer("posts", "post.events", "POST_CREATED");
  } catch (err) {
    console.error('❌ Application failed to start: ', err);
    process.exit(1);
  }
}

export {
  app, bootstrap
};
