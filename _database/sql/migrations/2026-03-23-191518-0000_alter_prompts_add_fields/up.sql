-- noinspection SqlDialectInspectionForFile
-- noinspection SqlNoDataSourceInspectionForFile
-- noinspection SqlResolveForFile

ALTER TABLE prompts
ADD COLUMN maybe_generation_mode VARCHAR(24) DEFAULT NULL,
ADD COLUMN maybe_aspect_ratio VARCHAR(24) DEFAULT NULL,
ADD COLUMN maybe_resolution VARCHAR(16) DEFAULT NULL,
ADD COLUMN maybe_duration VARCHAR(8) DEFAULT NULL,
ADD COLUMN maybe_batch_count TINYINT UNSIGNED DEFAULT NULL,
ADD COLUMN maybe_generate_audio BOOLEAN DEFAULT NULL;
