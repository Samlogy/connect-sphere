import { createClient } from 'redis';

let redisClient: ReturnType<typeof createClient>;
async function startRedis() {
  redisClient = createClient({
    url: `redis://${process.env.REDIS_HOST}:${process.env.REDIS_PORT}`,
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