-- noinspection SqlDialectInspectionForFile
-- noinspection SqlNoDataSourceInspectionForFile
-- noinspection SqlResolveForFile

CREATE TABLE tag_uses (
  -- Not used for anything except replication.
  id BIGINT(20) NOT NULL AUTO_INCREMENT,

  -- ========== TAG LINK ==========

  -- Token of the tag
  tag_token VARCHAR(32) NOT NULL,

  -- ========== LINKED ENTITY ==========

  -- Entity the tag is linked to (composite key)
  entity_type VARCHAR(32) NOT NULL,

  -- Entity the tag is linked to (composite key)
  entity_token VARCHAR(32) NOT NULL,

  -- ========== TIMESTAMPS ==========

  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  maybe_deleted_at TIMESTAMP NULL,

  -- INDICES --
  PRIMARY KEY (id),
  UNIQUE KEY (tag_token, entity_type, entity_token),

  KEY index_tag_token (tag_token),
  KEY index_entity_type_and_token (entity_type, entity_token),
  KEY index_maybe_deleted_at (maybe_deleted_at)

) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin;
