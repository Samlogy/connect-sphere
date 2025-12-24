import { Client } from '@elastic/elasticsearch';
import config from './config';

export const esClient = new Client({ node: config.elastic.ELASTIC_URL });

export async function ensureIndices() {
  const indices = [
    { name: 'posts', mapping: require('./mappings/indices').postMapping },
    { name: 'users', mapping: require('./mappings/indices').userMapping },
    { name: 'products', mapping: require('./mappings/indices').productMapping }
  ];
  for (const idx of indices) {
    const exists = await esClient.indices.exists({ index: idx.name });
    if (!exists) {
      await esClient.indices.create({
        index: idx.name,
        body: idx.mapping
      });
      console.log(`✅ Created index ${idx.name}`);
    } else {
      console.log(`ℹ️ Index ${idx.name} already exists`);
    }
  }
}




// Index single doc (idempotent: use same id)
export async function indexDocument(index: string, id: string, body: any) {
  return esClient.index({
    index,
    id,
    document: body,
    refresh: 'false' // don't refresh on each doc; use bulk or periodic refresh in prod
  });
}

// Bulk index with array of { index, id, body } items
export async function bulkIndex(docs: Array<{index:string, id:string, body:any}>) {
  if (!docs.length) return { took:0 };
  const bulkBody: any[] = [];
  for (const d of docs) {
    bulkBody.push({ index: { _index: d.index, _id: d.id } });
    bulkBody.push(d.body);
  }
  const response = await esClient.bulk({ refresh: 'true', operations: bulkBody });
  if (response.errors) {
    // log failures and handle accordingly
    const items = response.items || [];
    const failed = items.filter((it:any) => {
      const op = Object.values(it)[0] as any;
      return op && op.error;
    });
    console.error('Bulk indexing had failures:', failed);
  }
  return response;
}

export async function searchIndex(index: string, query:any, size=10, from=0) {
  return esClient.search({
    index,
    body: query,
    size,
    from
  });
}
