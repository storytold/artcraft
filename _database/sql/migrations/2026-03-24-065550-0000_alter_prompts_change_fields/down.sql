-- noinspection SqlDialectInspectionForFile
-- noinspection SqlNoDataSourceInspectionForFile
-- noinspection SqlResolveForFile

ALTER TABLE prompts
DROP COLUMN maybe_duration_seconds,
ADD COLUMN maybe_duration VARCHAR(8) DEFAULT NULL;
