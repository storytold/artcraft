-- noinspection SqlDialectInspectionForFile
-- noinspection SqlNoDataSourceInspectionForFile
-- noinspection SqlResolveForFile

ALTER TABLE media_files
  ADD COLUMN is_in_aws BOOLEAN NOT NULL DEFAULT FALSE
  AFTER maybe_public_bucket_extension;

ALTER TABLE media_files
  ADD INDEX index_is_in_aws (is_in_aws);
