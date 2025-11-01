import { createClient } from 'redis';
import config from './config';

let redisClient: ReturnType<typeof createClient>;
async function startRedis() {
  redisClient = createClient({
    url: config.cache.url
  });

  redisClient.on('error', (err) => console.error('❌ Redis error: ', err));

  await redisClient.connect();
  console.log('✅ Redis connected successfully.');

  return redisClient;
}

export {
  redisClient,
  startRedis
}