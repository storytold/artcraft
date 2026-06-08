-- NB: This is a manually squashed view of all the CREATE and ALTER statements,
-- with comments attached to the fields for centralized documentation.

-- noinspection SqlDialectInspectionForFile
-- noinspection SqlNoDataSourceInspectionForFile
-- noinspection SqlResolveForFile

-- N:M mapping between `folders` and `media_files`. Rows are hard-deleted
-- when a media file is removed from a folder — no soft-delete column.
CREATE TABLE folder_media_files (
  -- Auto-increment for posterity / row-creation ordering. Not the primary
  -- key — the composite (folder_token, media_file_token) is. AUTO_INCREMENT
  -- requires its own key, hence the UNIQUE KEY below.
  id BIGINT(20) UNSIGNED NOT NULL AUTO_INCREMENT,

  -- The folder this membership belongs to.
  folder_token VARCHAR(32) NOT NULL,

  -- The media file in the folder.
  media_file_token VARCHAR(32) NOT NULL,

  -- When the media file was added to the folder. Rows are hard-deleted
  -- when a media file is removed, so there is no `maybe_deleted_at`.
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

  -- INDICES --
  PRIMARY KEY (folder_token, media_file_token),
  UNIQUE KEY (id),
  KEY index_folder_token (folder_token),
  KEY index_media_file_token (media_file_token)

) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin;
