-- noinspection SqlDialectInspectionForFile
-- noinspection SqlNoDataSourceInspectionForFile
-- noinspection SqlResolveForFile

ALTER TABLE debug_logs
  ADD COLUMN maybe_log_level VARCHAR(16) DEFAULT NULL AFTER debug_log_type;
