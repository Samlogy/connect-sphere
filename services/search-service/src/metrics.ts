import client from "prom-client";

export const register = new client.Registry();
client.collectDefaultMetrics({ register });

export const searchLatency = new client.Histogram({
  name: "search_latency_seconds",
  help: "Search latency",
  buckets: [0.1, 0.3, 0.5, 1, 2],
});

register.registerMetric(searchLatency);
