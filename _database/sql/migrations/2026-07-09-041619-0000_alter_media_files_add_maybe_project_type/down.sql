-- noinspection SqlDialectInspectionForFile
-- noinspection SqlNoDataSourceInspectionForFile
-- noinspection SqlResolveForFile

ALTER TABLE media_files
  DROP INDEX index_maybe_project_type,
  DROP COLUMN maybe_project_type;
