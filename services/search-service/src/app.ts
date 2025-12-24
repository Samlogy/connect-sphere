import express from "express";
import config from "./config";
import { logger } from "./logger";
import { connectRabbit } from "./broker";
import { redisClient } from "./cache";
import {esClient, initPostIndex} from "./services"

console.log(config)

export function buildSearchKey(
  index: string,
  query: string,
  offset: number,
  limit: number
) {
  return `search:${index}:${query}:${offset}:${limit}`;
}

export async function getCachedSearch(key: string) {
  const cached = await redisClient.get(key);
  return cached ? JSON.parse(cached) : null;
}

export async function setCachedSearch(
  key: string,
  data: any,
  ttlSeconds = 60
) {
  await redisClient.setex(key, ttlSeconds, JSON.stringify(data));
}


export async function searchPosts(
  query: string,
  offset: number,
  limit: number
) {
  const cacheKey = buildSearchKey("posts", query, offset, limit);

  const cached = await getCachedSearch(cacheKey);
  if (cached) {
    logger.info("⚡ CACHE HIT");
    return cached;
  }

  logger.info("❌ CACHE MISS → Elasticsearch");

  const result = await esClient.search({
    index: "posts",
    from: offset,
    size: limit,
    query: {
      multi_match: {
        query,
        fields: ["title^3", "content"],
        fuzziness: "AUTO",
      },
    },
  });

  const response = result.hits.hits.map((hit: any) => ({
    id: hit._id,
    score: hit._score,
    ...hit._source,
  }));

  await setCachedSearch(cacheKey, response);

  return response;
}


export async function indexPost(post: any) {
  await esClient.index({
    index: "posts",
    id: post.id,
    document: post,
  });
}

export async function startPostConsumer() {
  const {channel} = await connectRabbit();
  await channel.assertQueue("post.events");

  channel.consume("post.events", async (msg) => {
    if (!msg) return;

    const event = JSON.parse(msg.content.toString());

    if (event.type === "POST_CREATED") {
      await indexPost(event.data);
      logger.info("📥 Post indexed from event");
    }

    channel.ack(msg);
  });
}


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
    // await startRedis();
    await initPostIndex();
    await startPostConsumer();
    
        
    await startServer(PORT);
  } catch (err) {
    console.error('❌ Application failed to start: ', err);
    process.exit(1);
  }
}

export {
  app, bootstrap
};