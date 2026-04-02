-- noinspection SqlDialectInspectionForFile
-- noinspection SqlNoDataSourceInspectionForFile
-- noinspection SqlResolveForFile

CREATE TABLE characters (
  -- Not used for anything except replication (private, not even used in queries)
  id BIGINT(20) NOT NULL AUTO_INCREMENT,

  -- Public-facing "primary key" (PUBLIC)
  token VARCHAR(32) NOT NULL,

  -- Whether the character has been fully created and is available for use.
  -- A character may exist in the database before its creation job completes.
  is_active BOOLEAN NOT NULL DEFAULT false,

  -- ========== CHARACTER DETAILS ==========

  -- User's display name for the character.
  name VARCHAR(255) NOT NULL,

  -- Optional user description of the character.
  maybe_description VARCHAR(512) DEFAULT NULL,

  -- ========== MEDIA ==========

  -- Avatar image (cropped to face, ideally).
  maybe_avatar_media_token VARCHAR(32) DEFAULT NULL,

  -- Full-size reference image.
  maybe_full_image_media_token VARCHAR(32) DEFAULT NULL,

  -- ========== CREATOR ==========

  -- The user who created this character.
  maybe_creator_user_token VARCHAR(32) DEFAULT NULL,

  -- For abuse tracking.
  creator_ip_address VARCHAR(40) NOT NULL,

  -- ========== TIMESTAMPS ==========

  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP DEFAULT NULL,

  -- ========== INDICES ==========

  PRIMARY KEY (id),
  UNIQUE KEY (token),
  KEY index_maybe_creator_user_token (maybe_creator_user_token),
  KEY index_is_active (is_active),
  KEY index_created_at (created_at),
  KEY index_deleted_at (deleted_at)

) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin;
