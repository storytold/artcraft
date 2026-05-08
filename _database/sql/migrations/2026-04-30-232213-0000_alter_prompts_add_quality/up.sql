-- noinspection SqlDialectInspectionForFile
-- noinspection SqlNoDataSourceInspectionForFile
-- noinspection SqlResolveForFile

-- Add quality parameter to prompts table.
-- Represented by the enum `CommonQuality` (high, medium, low).
ALTER TABLE prompts
  ADD COLUMN maybe_quality VARCHAR(16) DEFAULT NULL;
