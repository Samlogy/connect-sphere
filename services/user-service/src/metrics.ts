import { Counter, Gauge, Histogram, register, collectDefaultMetrics } from 'prom-client';

collectDefaultMetrics({ prefix: 'svc_', register });

// Technical / infrastructure
export const httpRequestsTotal = new Counter({
  name: 'svc_http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method','route','status']
});
export const httpRequestDuration = new Histogram({
  name: 'svc_http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method','route','status'],
  buckets: [0.005,0.01,0.025,0.05,0.1,0.25,0.5,1,2.5,5]
});
export const errorsTotal = new Counter({
  name: 'svc_errors_total',
  help: 'Total number of errors by type',
  labelNames: ['type']
});
// Business/service-specific
export const userRegistrationsTotal = new Counter({
  name: 'svc_user_registrations_total',
  help: 'Total number of user registrations'
});
export const userLoginsTotal = new Counter({
  name: 'svc_user_logins_total',
  help: 'Total number of user login attempts',
  labelNames: ['outcome']  // e.g., “success”, “fail”
});
export const userFollowsTotal = new Counter({
  name: 'svc_user_follows_total',
  help: 'Total number of follow operations'
});

// Example cache metrics
export const cacheRequestsTotal = new Counter({
  name: 'svc_cache_requests_total',
  help: 'Total number of cache access attempts',
  labelNames: ['cache']
});
export const cacheHitsTotal = new Counter({
  name: 'svc_cache_hits_total',
  help: 'Total number of cache hits',
  labelNames: ['cache']
});

// Example DB query duration (you will instrument around queries)
export const dbQueryDuration = new Histogram({
  name: 'svc_db_query_duration_seconds',
  help: 'Duration of database queries in seconds',
  labelNames: ['query']
});
