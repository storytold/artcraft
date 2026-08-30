-- noinspection SqlDialectInspectionForFile
-- noinspection SqlNoDataSourceInspectionForFile
-- noinspection SqlResolveForFile

ALTER TABLE media_files
  DROP INDEX index_maybe_source_job_token,
  DROP COLUMN maybe_source_job_token;
