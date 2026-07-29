-- noinspection SqlDialectInspectionForFile
-- noinspection SqlNoDataSourceInspectionForFile
-- noinspection SqlResolveForFile

ALTER TABLE media_files
  DROP INDEX index_is_in_aws,
  DROP COLUMN is_in_aws;
