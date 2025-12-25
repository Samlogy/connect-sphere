import { Request, Response } from 'express';
import { esClient, reindexDocuments, searchRessource } from './elastic';


// Controllers *****************
export async function search(req: Request, res: Response) {
  try {
  const q = req.query.q as string;
  const offset = Number(req.query.offset || 0);
  const limit = Number(req.query.limit || 10);
  const ressourceType = req.body.ressourceType || "posts";

  const results = await searchRessource(ressourceType, q, offset, limit);
  res.json({
    success: true,
    data: results
  });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Search failed' });
  }
}

export async function health(_:any, res: Response) {
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
    const result = await reindexDocuments(index, docs)
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