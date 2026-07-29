-- noinspection SqlDialectInspectionForFile
-- noinspection SqlNoDataSourceInspectionForFile
-- noinspection SqlResolveForFile

-- Composite index for the library / user profile list queries:
--   WHERE maybe_creator_user_token = ? ... ORDER BY created_at DESC LIMIT n
--
-- Without this, the optimizer picks an index-merge intersection against huge
-- low-selectivity indexes (e.g. index_user_deleted_at, ~4.75M NULL entries),
-- scanning millions of index records per page load.
--
-- NB: ADD INDEX is online DDL (ALGORITHM=INPLACE, LOCK=NONE) — reads and writes
-- continue during the build. Expect a few minutes of elevated I/O on a table
-- this size (~8.5M rows).
ALTER TABLE media_files
  ADD INDEX idx_creator_created_at (maybe_creator_user_token, created_at),
  ALGORITHM=INPLACE, LOCK=NONE;
