-- NB: This is a manually squashed view of all the CREATE and ALTER statements,
-- with comments attached to the fields for centralized documentation.

-- noinspection SqlDialectInspectionForFile
-- noinspection SqlNoDataSourceInspectionForFile
-- noinspection SqlResolveForFile

-- Stores the media files (images) used as input when creating a character.
CREATE TABLE character_creation_assets (
  -- Not used for anything except replication.
  id BIGINT(20) NOT NULL AUTO_INCREMENT,

  -- Foreign key to the characters table.
  character_token VARCHAR(32) NOT NULL,

  -- The media file used as a creation input (e.g. reference image).
  asset_media_file_token VARCHAR(32) NOT NULL,

  -- ========== TIMESTAMPS ==========

  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

  -- ========== INDICES ==========

  PRIMARY KEY (id),
  KEY index_character_token (character_token),
  KEY index_asset_media_file_token (asset_media_file_token)

) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin;
