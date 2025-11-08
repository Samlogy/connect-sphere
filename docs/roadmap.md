#  Roadmap => Sr Software Engineer

**search-service:**

Search for users, products, and posts:

Responsibilities: support search queries across users, posts, media, marketplace items. Provide analytics.
Technology: Use Elasticsearch for full-text search, faceted search, analytics indexing.
Flow: On content creation/update (post, media, item) → service publishes event → Search service indexes document into Elasticsearch. Client search request → hits Search service → queries Elasticsearch and returns results.
Scaling: Elasticsearch cluster can be sharded/replicated; index updates can be batched or near-real-time; monitoring of shards/heap is necessary.
Reason: Relational DBs are poor for full-text search and analytics; Elasticsearch is optimized for such workloads.

**DB:**
transactions, locks, partitioning, replicas, sharding.

Next:
Use read replicas for heavy reads.
receive notification (consume/produce) on async using RabbitMQ (server->service)
delete login / register code

**GW:**
move register / login (auth) => gw (token based auth) + auth
auth = authenficiation + authorization => keycloak (oauth2)
add monitoring
add logging (APIM, clear format data)
auth + authorization
forward traffic => LB / service
caching
throttling / rate limiting
security: cors, https, ...
requestId: traçabilité des requêtes entre les differents microservice depuis la GW.

**scalling:**
horizontal scaling via replicas.
horizontal multiple instances.
Use read replicas for heavy reads.
Stateful services: DBs need read replicas and possibly sharding.
Redis clusters for caching.
RabbitMQ clusters for queue.
Elasticsearch cluster with sharding & replication.

**logging / monitpring:**
monitor metrics.
tracing app.

**Gestion secrets:**
Vault

logs, monitoring, tracing (observability)
scalability
resilience
....



## DONE

**User-service:**
beug fix => log system (non remonté log app => elasticsearch).

**logging / monitpring:**
logging system

**caching:**
strategies, inviction/invalidation, monitoring

**DB:**
Joins, indexes, triggers, functions, 