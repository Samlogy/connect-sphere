import Redis from "ioredis";
import config from './config';

export const redisClient = new Redis(config.cache.url);

export async function getCache(key: string) {
  const cached = await redisClient.get(key);
  return cached ? JSON.parse(cached) : null;
}

export async function setCache(
  key: string,
  data: any,
  ttlSeconds = 60
) {
  await redisClient.setex(key, ttlSeconds, JSON.stringify(data));
}