#  Roadmap => Sr Software Engineer

**User-service:**

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



## DONE
**logging / monitpring:**
logging system

**caching:**
strategies, inviction/invalidation, monitoring

**DB:**
Joins, indexes, triggers, functions, 