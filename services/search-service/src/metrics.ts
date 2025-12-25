import client, {register} from 'prom-client';

client.collectDefaultMetrics({ prefix: 'searchsvc_' });


export const searchLatency = new client.Histogram({
  name: "search_latency_seconds",
  help: "Search latency",
  buckets: [0.1, 0.3, 0.5, 1, 2],
});

export const httpRequestsTotal = new client.Counter({ name: 'http_requests_total', help: 'Total HTTP requests', labelNames: ['method', 'route', 'status'] });

export const httpRequestDuration = new client.Histogram({ name: 'http_request_duration_seconds', help: 'HTTP request duration', labelNames: ['method', 'route', 'status'], buckets: [0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5] });

export const esIndexErrors = new client.Counter({ name: 'es_index_errors_total', help: 'Elasticsearch index errors' });

export const esBulkIndexed = new client.Counter({ name: 'es_bulk_indexed_total', help: 'Number of documents bulk indexed' });

export const redisCacheHits = new client.Counter({ name: 'redis_cache_hits_total', help: 'Cache hits' });

export const redisCacheRequests = new client.Counter({ name: 'redis_cache_requests_total', help: 'Cache requests' });

client.collectDefaultMetrics({ register: client.register });

export default client.register;