import { Client } from '@elastic/elasticsearch';
import { connectRabbit } from './broker';

const ELASTIC_URL = process.env.ELASTIC_URL || 'http://localhost:9201';

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

// create POST index *****************
export async function initPostIndex() {
  const exists = await esClient.indices.exists({ index: "posts" });

  if (!exists) {
    await esClient.indices.create({
      index: "posts",
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

    console.log("✅ posts index created");
  } else {
    console.log("ℹ️ posts index already exists");
  }
  console.log('INDEX CREATED !!')
}

// elastic config *****************
export const esClient = new Client({ node: ELASTIC_URL });

// elastic services *****************
async function indexDocument(index: string, id: string, body: any) {
  return esClient.index({ index, id, document: body });
}

async function deleteDocument(index: string, id: string) {
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


async function ensureIndices() {
  const { postMapping, userMapping, productMapping } = { postMapping: POST_INDEX, userMapping: USER_INDEX, productMapping: PRODUCT_INDEX }

  const indices: Array<{ name: string; mapping: any }> = [
    { name: 'posts', mapping: postMapping },
    { name: 'users', mapping: userMapping },
    { name: 'products', mapping: productMapping }
  ];

  for (const idx of indices) {
    const exists = await esClient.indices.exists({ index: idx.name });
    if (!exists) {
      await esClient.indices.create({ index: idx.name, body: idx.mapping });
      console.log(`Created index ${idx.name}`);
    }
  }
}




// rabbitmq consumer & bulk indexer *****************
async function startIndexer() {
  const { conn, channel } = await connectRabbit();
  const q = 'search_events';
  await channel.assertQueue(q, { durable: true });


  console.log('Indexer waiting for messages');


  const buffer: Array<{ index: string; id: string; body: any }> = [];
  const MAX_BUFFER = 500;
  const FLUSH_MS = 2000;


  setInterval(async () => {
    if (buffer.length) {
      const docs = buffer.splice(0, buffer.length);
      try {
        await bulkIndex(docs);
      } catch (err) {
        console.error('Bulk index failed', err);
      }
    }
  }, FLUSH_MS);


  channel.consume(q, async (msg) => {
    if (!msg) return;
    try {
      const ev = JSON.parse(msg.content.toString());
      if (ev.type === 'PostCreated' || ev.type === 'PostUpdated') {
        buffer.push({ index: POST_INDEX, id: ev.payload.id, body: ev.payload });
      } else if (ev.type === 'UserCreated' || ev.type === 'UserUpdated') {
        buffer.push({ index: USER_INDEX, id: ev.payload.id, body: ev.payload });
      } else if (ev.type === 'ProductCreated' || ev.type === 'ProductUpdated') {
        buffer.push({ index: PRODUCT_INDEX, id: ev.payload.id, body: ev.payload });
      } else if (ev.type === 'PostDeleted' || ev.type === 'UserDeleted' || ev.type === 'ProductDeleted') {
        // direct deletion - process immediately
        try {
          await bulkIndex([{ index: ev.index, id: ev.payload.id, body: ev.payload }]);
        } catch (err) {
          console.error('delete handling error', err);
        }
      }
      channel.ack(msg);
    } catch (err) {
      console.error('Failed to consume message', err);
      channel.nack(msg, false, false);
    }
  }, { noAck: false });
}

// reindex helper *****************
async function reindexDocuments(index: string, docs: Array<{ id: string; body: any }>) {
  const payload = docs.map((d) => ({ index, id: d.id, body: d.body }));
  return bulkIndex(payload);
}


export {
  bulkIndex, deleteDocument, indexDocument, searchIndex
};
