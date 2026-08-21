-- noinspection SqlDialectInspectionForFile
-- noinspection SqlNoDataSourceInspectionForFile
-- noinspection SqlResolveForFile

ALTER TABLE debug_logs
  ADD COLUMN maybe_ip_address VARCHAR(40) DEFAULT NULL;
