-- noinspection SqlDialectInspectionForFile
-- noinspection SqlNoDataSourceInspectionForFile
-- noinspection SqlResolveForFile

CREATE TABLE folders (
  id BIGINT(20) UNSIGNED NOT NULL AUTO_INCREMENT,

  -- Effective "primary key" (PUBLIC, used by the API).
  token VARCHAR(32) NOT NULL,

  -- User-supplied folder name.
  name VARCHAR(255) NOT NULL,

  -- The user that owns this folder.
  owner_user_token VARCHAR(32) NOT NULL,

  -- Parent folder for nesting, NULL for top-level folders.
  maybe_parent_folder_token VARCHAR(32) DEFAULT NULL,

  -- The last four media files added to the folder, in order. These are
  -- denormalized for cheap thumbnail-grid rendering on folder cards
  -- without a separate fan-out query.
  maybe_last_media_file_token_1 VARCHAR(32) DEFAULT NULL,
  maybe_last_media_file_token_2 VARCHAR(32) DEFAULT NULL,
  maybe_last_media_file_token_3 VARCHAR(32) DEFAULT NULL,
  maybe_last_media_file_token_4 VARCHAR(32) DEFAULT NULL,

  -- Optional user-chosen cover image (a media file). Overrides the
  -- auto-grid thumbnail derived from the last-N media files above.
  maybe_cover_image_custom_media_token VARCHAR(32) DEFAULT NULL,

  -- Optional user-chosen color tag. Wide enough for "#RRGGBBAA" plus a
  -- short named-color fallback.
  maybe_color_code VARCHAR(16) DEFAULT NULL,

  -- Whether the user has starred / favorited this folder.
  has_star BOOLEAN NOT NULL DEFAULT FALSE,

  -- ========== TIMESTAMPS ==========

  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  -- Soft-delete timestamp. NULL means the folder is live.
  maybe_deleted_at TIMESTAMP NULL,

  -- INDICES --
  PRIMARY KEY (id),
  UNIQUE KEY (token),
  KEY fk_owner_user_token (owner_user_token),
  KEY fk_maybe_parent_folder_token (maybe_parent_folder_token),
  KEY index_folders_created_at (created_at),
  KEY index_folders_updated_at (updated_at),
  KEY index_maybe_deleted_at (maybe_deleted_at)

) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin;
