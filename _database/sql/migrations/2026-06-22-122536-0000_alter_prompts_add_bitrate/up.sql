-- noinspection SqlDialectInspectionForFile
-- noinspection SqlNoDataSourceInspectionForFile
-- noinspection SqlResolveForFile

-- Add bitrate parameter to prompts table.
-- Represented by the enum `CommonBitrate` (normal, high).
ALTER TABLE prompts
  ADD COLUMN maybe_bitrate VARCHAR(16) DEFAULT NULL;
