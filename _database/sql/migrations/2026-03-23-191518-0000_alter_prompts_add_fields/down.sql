-- noinspection SqlDialectInspectionForFile
-- noinspection SqlNoDataSourceInspectionForFile
-- noinspection SqlResolveForFile

ALTER TABLE prompts
DROP COLUMN maybe_generation_mode,
DROP COLUMN maybe_aspect_ratio,
DROP COLUMN maybe_resolution,
DROP COLUMN maybe_duration,
DROP COLUMN maybe_batch_count,
DROP COLUMN maybe_generate_audio;
