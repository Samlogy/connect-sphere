
what are caching strategies ? how to pich the right one ?
how to select ttl invalidation ?

# System Design Concepts

**Idempotent:**

- Idempotent operations = performing them multiple times has the same effect as doing it once.
ex: in rest api
- get, put, delete are idempotent.
- post is not idempotent unless i add ON CONFLICT.

**caching:**

- cache-aside: check cache first, if miss, get from db, put in cache. => (common caching pattern)
- write-through: write to cache and db at the same time. (cache source of truth). => data that must always be fresh. (consistency)
- write-behind: write to cache first, then async write to db. => a lot very high write throughput.
TTL:
depends on data volatility (how often data changes).
set a TTL value, then adjustbased on monitoring cache hit/miss rates and data freshness requirements.

**indexes:** (faster lookups)

- indexes are B-tree data structure that stores sorted values for quick retrieval of one or more columns. (jumps directly to the matching row).

- The lookup is faster (SELECT, ORDER BY, JOIN).
- slow down (INSERT, UPDATE, DELETE), it needs to update indexes.

- requires more space 10 - 30 % more disk space.
- requires maintenance (rebuild, analyzing) for stats.
- maintenance: (index bloat) due to update, delete, insert operations.
*use cases:*
frequently columns in WHERE clause, JOIN conditions, ORDER BY, GROUP BY.
avoid: frequest writes, small table.

**UUIDs vs SERIAL IDs:**

- Serial IDs: small projects, faster and sequential.
- UUIDs: ensure unique ID across services, federated DB, sharding.

**Replicas: (heavy reads)**

**Indexes Maintenance:**

| Step | Task                                | Frequency              | Automation Method      |
| ---- | ----------------------------------- | ---------------------- | ---------------------- |
| 1    | Analyze all tables                  | Daily                  | `ANALYZE`              |
| 2    | Vacuum all tables                   | Daily / Weekly         | `VACUUM (ANALYZE)`     |
| 3    | Detect index bloat                  | Weekly                 | SQL check              |
| 4    | Reindex bloated indexes             | Monthly / On detection | `REINDEX CONCURRENTLY` |
| 5    | Detect unused indexes               | Monthly                | Query stats            |
| 6    | Drop unused (if confirmed manually) | Manual                 | After verification     |

**automated scripts => indexes:**
Add crontab that run maintenance every Sunday at 2 AM.
pros:
Fully automated, Logs everything, Safe with concurrent reindex.

```sh
crontab -e
0 2 * * 0 psql -U postgres -d mydb -f /scripts/index_maintenance.sql >> /var/log/pg_index_maintenance.log 2>&1
```

##  Commands

```sh
# execute command inside container (bd, nodejs service, ...)
docker exec -it 48941743fb5d psql -U postgres -d postgres -c "your SQL command"   
docker exec -it postgres psql -U postgres -c "\l"   
docker exec -it 22b78142ad3b sh

docker exec -it 22b78142ad3b sh
psql -h localhost -U postgres -d userDB
```

```sh
# execute indexes maintenance
docker exec -it 22b78142ad3b psql -U postgres -d usersdb -c "VACUUM (ANALYZE) followers;"
VACUUM (ANALYZE) followers;

# create index
CREATE UNIQUE INDEX idx_users_email ON users(email);

# analyze indexes
## run weekly / daily => depends on write operations rate.
ANALYZE users;

# Periodically VACUUM (or AutoVacuum)
## delete dead tuples die wrie operations
## use autovacuum handle it automatically
## Monitor for bloat if your table has high write/delete activity.
VACUUM users;
# agressive version (in case high write/delete activity).
VACUUM (VERBOSE, ANALYZE) users;

# Detect and Rebuild Bloated indexes
## check bloat indexes
SELECT
  schemaname,
  relname AS table_name,
  indexrelname AS index_name,
  pg_size_pretty(pg_relation_size(i.indexrelid)) AS index_size
FROM pg_stat_user_indexes i
JOIN pg_index USING (indexrelid)
WHERE schemaname = 'public'
  AND relname = 'users';

## If index_size keeps growing faster than your table size, rebuild the index.
REINDEX INDEX idx_users_email;
## or rebuild all indexes in users table
REINDEX TABLE users;

# Check for Unused Indexes
## If idx_scan = 0 over time → index may be unnecessary.
SELECT
  relname AS table_name,
  indexrelname AS index_name,
  idx_scan AS times_used
FROM pg_stat_user_indexes
WHERE relname = 'users';

## drop index
DROP INDEX idx_users_email;

# Monitor Index Size and Growth
SELECT
  indexrelname AS index_name,
  pg_size_pretty(pg_relation_size(indexrelid)) AS size
FROM pg_stat_user_indexes
WHERE relname = 'users';

# Index Maintenance in prod
## rebuilding DB in prod (still in use)
## slower but safer for prod
REINDEX INDEX CONCURRENTLY idx_users_email;

# enable auto-vacuum & auto-analyze (by default)
SHOW autovacuum;
SHOW track_counts;

## re-enable auto-vacuum & auto-analyze (in case disabled)
ALTER TABLE users SET (autovacuum_enabled = true, autovacuum_vacuum_scale_factor = 0.2);
```



add config filebeat:

```sh
chmod 501 logs/filebeat.yml 
chown root logs/filebeat.yml 
```