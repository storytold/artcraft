-- noinspection SqlDialectInspectionForFile
-- noinspection SqlNoDataSourceInspectionForFile
-- noinspection SqlResolveForFile

ALTER TABLE user_sessions
  ADD COLUMN maybe_impersonation_user_token VARCHAR(32) DEFAULT NULL
  AFTER user_token;
