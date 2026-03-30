-- noinspection SqlDialectInspectionForFile
-- noinspection SqlNoDataSourceInspectionForFile
-- noinspection SqlResolveForFile

-- Stores prompts/descriptions used when creating a character.
CREATE TABLE character_creation_prompts (
  -- Not used for anything except replication.
  id BIGINT(20) NOT NULL AUTO_INCREMENT,

  -- Foreign key to the characters table.
  character_token VARCHAR(32) NOT NULL,

  -- The prompt or description used during character creation.
  prompt TEXT DEFAULT NULL,

  -- ========== TIMESTAMPS ==========

  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

  -- ========== INDICES ==========

  PRIMARY KEY (id),
  KEY index_character_token (character_token)

) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin;
