import { Request, Response } from 'express';
import {mappgins, esClient, bulkIndex, searchIndex} from "./services"
import { searchPosts } from './app';


// export const RABBIT_URL = process.env.RABBIT_URL || 'amqp://localhost';
// export const REDIS_URL = process.env.REDIS_URL || 'http://localhost:6380';
// export const PROM_METRICS_PATH = process.env.PROM_METRICS_PATH || '/metrics';


// Controllers *****************
export async function search(req: Request, res: Response) {
  try {
  const q = req.query.q as string;
  const offset = Number(req.query.offset || 0);
  const limit = Number(req.query.limit || 10);

  const results = await searchPosts(q, offset, limit);
  res.json(results);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Search failed' });
  }
}

export async function health(req: Request, res: Response) {
  try {
    const ping = await esClient.ping();
    res.json({ ok: true, ping });
  } catch (err: any) {
    res.status(503).json({ ok: false, error: err.message });
  }
}

export async function reindex(req: Request, res: Response) {
  // naive endpoint to accept a body of docs to reindex
  try {
    const { index, docs } = req.body;
    if (!index || !Array.isArray(docs)) return res.status(400).json({ error: 'index and docs required' });
    const payload = docs.map((d: any) => ({ index, id: d.id, body: d.body }));
    const result = await bulkIndex(payload);
    res.json({ ok: true, result });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Reindexing failed' });
  }
}


export default {
  search: {
    health,
    search,
    reindex
  },
}