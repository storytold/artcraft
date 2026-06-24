-- noinspection SqlDialectInspectionForFile
-- noinspection SqlNoDataSourceInspectionForFile
-- noinspection SqlResolveForFile

ALTER TABLE uploaded_videos
  ADD COLUMN maybe_filename VARCHAR(512) DEFAULT NULL AFTER filesize_bytes;
