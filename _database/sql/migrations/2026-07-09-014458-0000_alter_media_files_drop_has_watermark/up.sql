-- noinspection SqlDialectInspectionForFile
-- noinspection SqlNoDataSourceInspectionForFile
-- noinspection SqlResolveForFile

-- NB: MySQL 8.0.29+ performs DROP COLUMN with ALGORITHM=INSTANT (metadata-only).
-- On older versions this is an INPLACE table rebuild that still permits
-- concurrent reads and writes. No ALGORITHM clause so the server picks the
-- best available.
ALTER TABLE media_files
  DROP COLUMN has_watermark;
