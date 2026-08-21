-- noinspection SqlDialectInspectionForFile
-- noinspection SqlNoDataSourceInspectionForFile
-- noinspection SqlResolveForFile

-- Which kind of internal Artcraft project document this media file is
-- ('scene_3d', 'mood_board', 'workflow', 'video_timeline', ...).
-- Only set when media_class = 'project'. The file format lives in media_type;
-- the JSON payload carries its own schema version.
ALTER TABLE media_files
  ADD COLUMN maybe_project_type VARCHAR(32) DEFAULT NULL
  AFTER media_class;

-- For "list my mood boards"-style filtered queries.
-- The column is all-NULL at creation time, so the index build is cheap.
ALTER TABLE media_files
  ADD INDEX index_maybe_project_type (maybe_project_type);
