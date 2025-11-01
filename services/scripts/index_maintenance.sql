-- index_maintenance.sql
-- 1️⃣ Update planner stats
ANALYZE;

-- 2️⃣ Vacuum to clean dead tuples
VACUUM (ANALYZE);

-- 3️⃣ Detect bloated indexes (size much larger than expected)
-- Logs potential candidates for reindexing
CREATE TEMP TABLE index_bloat_candidates AS
SELECT
  schemaname,
  relname AS table_name,
  indexrelname AS index_name,
  pg_size_pretty(pg_relation_size(i.indexrelid)) AS index_size,
  idx_scan,
  now() AS checked_at
FROM pg_stat_user_indexes i
JOIN pg_index USING (indexrelid)
WHERE schemaname = 'public'
  AND pg_relation_size(i.indexrelid) > 50 * 1024 * 1024  -- > 50 MB
ORDER BY pg_relation_size(i.indexrelid) DESC;

-- 4️⃣ Reindex bloated indexes (non-blocking)
DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN SELECT * FROM index_bloat_candidates LOOP
    RAISE NOTICE 'Reindexing index: %.%', r.schemaname, r.index_name;
    EXECUTE format('REINDEX INDEX CONCURRENTLY %I.%I;', r.schemaname, r.index_name);
  END LOOP;
END $$;

-- 5️⃣ Log unused indexes (no scans recorded)
COPY (
  SELECT
    schemaname,
    relname AS table_name,
    indexrelname AS index_name,
    idx_scan,
    pg_size_pretty(pg_relation_size(indexrelid)) AS size,
    now() AS checked_at
  FROM pg_stat_user_indexes
  WHERE idx_scan = 0
) TO '/var/log/postgres_unused_indexes.csv' WITH CSV HEADER;
