-- noinspection SqlDialectInspectionForFile
-- noinspection SqlNoDataSourceInspectionForFile
-- noinspection SqlResolveForFile

ALTER TABLE media_files
  ADD COLUMN nsfw_status VARCHAR(32) NOT NULL DEFAULT 'unknown'
  AFTER maybe_scene_source_media_file_token;

ALTER TABLE media_files
  ADD INDEX index_nsfw_status (nsfw_status);
