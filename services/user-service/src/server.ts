import startServer from "./app";
import {startRedis} from "./cache";
import { pool, initDB } from "./db";

const PORT = process.env.PORT || 4001;


async function bootstrap() {
  try {
    // await startPostgres();

    await initDB();

    await startRedis();

    await startServer();

  } catch (err) {
    console.error('❌ Application failed to start: ', err);
    process.exit(1);
  }
}

bootstrap();