-- noinspection SqlDialectInspectionForFile
-- noinspection SqlNoDataSourceInspectionForFile
-- noinspection SqlResolveForFile

-- The inference job ('jinf_...') whose completion produced this media file.
-- Only set for files written as job outputs; uploads and other origins stay NULL.
ALTER TABLE media_files
  ADD COLUMN maybe_source_job_token VARCHAR(32) DEFAULT NULL;

-- For "outputs of this job"-style lookups.
-- The column is all-NULL at creation time, so the index build is cheap.
ALTER TABLE media_files
  ADD INDEX index_maybe_source_job_token (maybe_source_job_token);
