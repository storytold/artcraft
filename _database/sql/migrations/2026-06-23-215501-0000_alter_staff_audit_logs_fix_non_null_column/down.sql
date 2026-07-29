-- noinspection SqlDialectInspectionForFile
-- noinspection SqlNoDataSourceInspectionForFile
-- noinspection SqlResolveForFile

-- Revert `maybe_entity_token` back to NOT NULL.
-- NB: This will fail if any rows have a null `maybe_entity_token`.
ALTER TABLE staff_audit_logs
  MODIFY COLUMN maybe_entity_token VARCHAR(32) NOT NULL;
