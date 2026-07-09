-- noinspection SqlDialectInspectionForFile
-- noinspection SqlNoDataSourceInspectionForFile
-- noinspection SqlResolveForFile

ALTER TABLE media_files
  DROP INDEX index_nsfw_status,
  DROP COLUMN nsfw_status;
