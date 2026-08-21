-- noinspection SqlDialectInspectionForFile
-- noinspection SqlNoDataSourceInspectionForFile
-- noinspection SqlResolveForFile

CREATE TABLE tags (
  -- Not used for anything except replication.
  id BIGINT(20) UNSIGNED NOT NULL AUTO_INCREMENT,

  -- Effective "primary key".
  token VARCHAR(32) NOT NULL,

  -- The display value of the tag, as entered by the creator.
  tag_value VARCHAR(255) NOT NULL,

  -- Lowercased copy of `tag_value` for case-insensitive uniqueness and lookup.
  -- (The table collation is utf8mb4_bin, so the code must lowercase this.)
  tag_value_lowercase VARCHAR(255) NOT NULL,

  -- The user that created the tag.
  creator_user_token VARCHAR(32) NOT NULL,

  -- Rollup statistic for usage counts.
  use_count INT(10) UNSIGNED NOT NULL DEFAULT 0,

  -- ========== TIMESTAMPS ==========

  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  maybe_deleted_at TIMESTAMP NULL DEFAULT NULL,

  -- INDICES --
  PRIMARY KEY (id),
  UNIQUE KEY (token),
  UNIQUE KEY (tag_value_lowercase, creator_user_token),

  KEY index_creator_user_token (creator_user_token)

) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin;
