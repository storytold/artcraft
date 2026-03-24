-- noinspection SqlDialectInspectionForFile
-- noinspection SqlNoDataSourceInspectionForFile
-- noinspection SqlResolveForFile

ALTER TABLE prompts
DROP COLUMN maybe_duration,
ADD COLUMN maybe_duration_seconds INT UNSIGNED DEFAULT NULL;
