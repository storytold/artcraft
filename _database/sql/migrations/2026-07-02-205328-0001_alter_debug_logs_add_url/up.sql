-- noinspection SqlDialectInspectionForFile
-- noinspection SqlNoDataSourceInspectionForFile
-- noinspection SqlResolveForFile

ALTER TABLE debug_logs
  ADD COLUMN maybe_url VARCHAR(255) DEFAULT NULL;
