-- noinspection SqlDialectInspectionForFile
-- noinspection SqlNoDataSourceInspectionForFile
-- noinspection SqlResolveForFile

ALTER TABLE media_files
  DROP INDEX idx_creator_created_at,
  ALGORITHM=INPLACE, LOCK=NONE;
