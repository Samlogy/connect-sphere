import config from './config';
import Redis from "ioredis";

export const redisClient = new Redis(config.cache.url);