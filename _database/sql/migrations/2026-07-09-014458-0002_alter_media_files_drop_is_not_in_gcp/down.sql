-- noinspection SqlDialectInspectionForFile
-- noinspection SqlNoDataSourceInspectionForFile
-- noinspection SqlResolveForFile

-- NB: anchored to maybe_public_bucket_extension (not is_in_aws) so this works
-- whether or not the is_in_aws drop migration has been reverted yet.
ALTER TABLE media_files
  ADD COLUMN is_not_in_gcp BOOLEAN NOT NULL DEFAULT FALSE
  AFTER maybe_public_bucket_extension;
