-- noinspection SqlDialectInspectionForFile
-- noinspection SqlNoDataSourceInspectionForFile
-- noinspection SqlResolveForFile

-- `maybe_entity_token` is optional (many audited actions have no entity), but it
-- was mistakenly created as NOT NULL, so inserts with a null entity token fail
-- with "Column 'maybe_entity_token' cannot be null". Make it nullable.
ALTER TABLE staff_audit_logs
  MODIFY COLUMN maybe_entity_token VARCHAR(32) DEFAULT NULL;
