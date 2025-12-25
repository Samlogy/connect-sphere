import { Client } from '@elastic/elasticsearch';
import { getCache, setCache } from './cache';
import { logger } from './logger';
import config from './config';


// mapping indices *****************
const POST_INDEX = "posts_index";
const USER_INDEX = "users_index";
const PRODUCT_INDEX = "products_index";

export const mappgins = {
  POST_INDEX,
  USER_INDEX,
  PRODUCT_INDEX
}

const postMapping = {
  settings: {
    analysis: {
      analyzer: {
        autocomplete_analyzer: {
          type: 'custom',
          tokenizer: 'autocomplete_tokenizer',
          filter: ['lowercase']
        },
        autocomplete_search_analyzer: {
          type: 'custom',
          tokenizer: 'standard',
          filter: ['lowercase']
        }
      },
      tokenizer: {
        autocomplete_tokenizer: {
          type: 'edge_ngram',
          min_gram: 2,
          max_gram: 20,
          token_chars: ['letter', 'digit', 'whitespace']
        }
      }
    }
  },
  mappings: {
    properties: {
      id: { type: 'keyword' },
      user_id: { type: 'keyword' },
      title: { type: 'text', analyzer: 'autocomplete_analyzer', search_analyzer: 'autocomplete_search_analyzer' },
      content: { type: 'text' },
      tags: { type: 'keyword' },
      media_url: { type: 'keyword' },
      description: { type: 'text', analyzer: 'product_analyzer' },
      price: { type: 'double' },
      seller_id: { type: 'keyword' },
      created_at: { type: 'date' }
    }
  }
};

// elastic config *****************
export const esClient = new Client({ node: config.elastic.ELASTIC_URL });


// create POST index *****************
export async function initRessourceIndex(index: string) {
  const exists = await esClient.indices.exists({ index });

  if (!exists) {
    await esClient.indices.create({
      index,
      body: {
        settings: {
          analysis: {
            analyzer: {
              autocomplete: {
                type: 'custom',
                tokenizer: "autocomplete",
                filter: ["lowercase"]
              }
            },
            tokenizer: {
              autocomplete: {
                type: "edge_ngram",
                min_gram: 2,
                max_gram: 20
              }
            }
          }
        },
        mappings: {
          properties: {
            id: { type: "keyword" },
            title: {
              type: "text",
              analyzer: "autocomplete",
              search_analyzer: "standard"
            },
            content: { type: "text" },
            author_id: { type: "keyword" },
            created_at: { type: "date" }
          }
        }
      }
    });

    logger.info("✅ posts index created");
  } else {
    logger.info("ℹ️ posts index already exists");
  }
}
// init multiple ressource index
// another method


// elastic services *****************
async function deleteRessource(index: string, id: string) {
  try {
    return await esClient.delete({ index, id });
  } catch (err: any) {
    if (err?.meta?.body?.result === 'not_found') return null;
    throw err;
  }
}

async function bulkIndex(docs: Array<{ index: string; id: string; body: any }>) {
  if (!docs.length) return { took: 0 };
  const operations: any[] = [];
  for (const d of docs) {
    operations.push({ index: { _index: d.index, _id: d.id } });
    operations.push(d.body);
  }
  const result = await esClient.bulk({ operations, refresh: false });
  if (result.errors) {
    // console.error('Bulk errors:', result.items?.filter((i: any) => Object.values(i)[0].error));
    console.error('Bulk errors: ', result.items?.filter((i: any) => Object.values(i)[0]));
  }
  return result;
}

async function searchIndex(index: string, body: any, size = 10, from = 0) {
  return esClient.search({ index, body, size, from });
}

export function buildSearchKey(
  index: string,
  query: string,
  offset: number,
  limit: number
) {
  return `search:${index}:${query}:${offset}:${limit}`;
}

export async function searchRessource(
  index: string,
  query: string,
  offset: number,
  limit: number
) {
  const cacheKey = buildSearchKey(index, query, offset, limit);

  const cached = await getCache(cacheKey);
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

  await setCache(cacheKey, response);

  return response;
}

export async function indexRessource(index: string, event: string, data: any) {
  if (event.includes("_UPDATED") || event.includes("_CREATED")) {
    await esClient.index({
      index,
      id: data.id,
      document: data,
    });
    logger.info(index + " ressouce "+ event);
  }
  if (event.includes("_DELETED")) {
    await deleteRessource(index, data.id)
    logger.info(index + " ressouce "+ event);
  }
}

export async function reindexDocuments(index: string, docs: Array<{ id: string; body: any }>) {
  const payload = docs.map((d) => ({ index, id: d.id, body: d.body }));
  return bulkIndex(payload);
}

