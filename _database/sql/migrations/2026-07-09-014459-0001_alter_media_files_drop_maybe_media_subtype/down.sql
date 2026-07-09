-- noinspection SqlDialectInspectionForFile
-- noinspection SqlNoDataSourceInspectionForFile
-- noinspection SqlResolveForFile

ALTER TABLE media_files
  ADD COLUMN maybe_media_subtype VARCHAR(32) DEFAULT NULL
  AFTER media_class;
