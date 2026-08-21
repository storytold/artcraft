-- noinspection SqlDialectInspectionForFile
-- noinspection SqlNoDataSourceInspectionForFile
-- noinspection SqlResolveForFile

ALTER TABLE debug_logs
  ADD INDEX index_maybe_log_level (maybe_log_level);
