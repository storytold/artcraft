-- NB: This is a manually squashed view of all the CREATE and ALTER statements,
-- with comments attached to the fields for centralized documentation.

-- noinspection SqlDialectInspectionForFile
-- noinspection SqlNoDataSourceInspectionForFile
-- noinspection SqlResolveForFile

-- N:M mapping between `media_files` and `tags`, scoped to the owning user.
CREATE TABLE media_file_tags (
  -- Not used for anything except replication.
  id BIGINT(20) UNSIGNED NOT NULL AUTO_INCREMENT,

  -- The media file being tagged.
  media_file_token VARCHAR(32) NOT NULL,

  -- The tag applied to the media file.
  tag_token VARCHAR(32) NOT NULL,

  -- The user that owns this tagging.
  user_token VARCHAR(32) NOT NULL,

  -- ========== TIMESTAMPS ==========

  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

  -- INDICES --
  PRIMARY KEY (id),
  UNIQUE KEY (media_file_token, tag_token, user_token),

  KEY index_media_file_token_and_user_token (media_file_token, user_token),
  KEY index_tag_token_and_user_token (tag_token, user_token),
  KEY index_media_file_token (media_file_token),
  KEY index_tag_token (tag_token),
  KEY index_user_token (user_token)

) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin;
