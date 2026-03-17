-- noinspection SqlDialectInspectionForFile
-- noinspection SqlNoDataSourceInspectionForFile
-- noinspection SqlResolveForFile

ALTER TABLE media_files
ADD COLUMN
maybe_thumbnail_version TINYINT UNSIGNED DEFAULT NULL;
