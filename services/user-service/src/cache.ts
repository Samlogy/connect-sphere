import { createClient } from 'redis';

export async function startRedis() {
  const client = createClient({
    url: `redis://${process.env.REDIS_HOST}:${process.env.REDIS_PORT}`,
  });

  client.on('error', (err) => console.error('❌ Redis error:', err));

  await client.connect();
  console.log('✅ Redis connected successfully.');

  return client;
}