-- NB: This is a manually squashed view of all the CREATE and ALTER statements,
-- with comments attached to the fields for centralized documentation.

-- noinspection SqlDialectInspectionForFile
-- noinspection SqlNoDataSourceInspectionForFile
-- noinspection SqlResolveForFile

-- Maps our characters to their representations in third-party systems.
-- A single character may have entries in multiple third-party systems
-- (e.g. Kinovi for Seedance, Runway for Gen-3, etc.).
-- If a third-party character needs to be recreated, a new row is inserted.
CREATE TABLE character_third_party_entities (
  -- Not used for anything except replication.
  id BIGINT(20) NOT NULL AUTO_INCREMENT,

  -- Effective "primary key" (PUBLIC)
  -- We may need to recreate the character in a third party, so this gets its own token.
  token VARCHAR(32) NOT NULL,

  -- Foreign key to the characters table.
  character_token VARCHAR(32) NOT NULL,

  -- Whether this third-party entity is active and usable.
  is_active BOOLEAN NOT NULL DEFAULT false,

  -- ========== THIRD PARTY DETAILS ==========

  -- Which third-party system the character lives in (enum crate type).
  -- e.g. "kinovi", "runway", etc.
  third_party VARCHAR(32) NOT NULL,

  -- Which types of models can use this character (enum crate type).
  -- e.g. "seedance_2_pro", "seedance_2_fast", etc.
  third_party_scopes VARCHAR(32) NOT NULL,

  -- The identifier in the third-party system.
  -- e.g. Kinovi's "char_1774752056469_2wlxoq"
  third_party_id VARCHAR(64) NOT NULL,

  -- The name used by the third party.
  -- Important for Kinovi since characters are referenced by name in prompts.
  third_party_name VARCHAR(255) NOT NULL,

  -- An upstream third party of the third party (if any).
  -- e.g. Kinovi's assetId "asset-20260329104101-kk5kl"
  maybe_fourth_party_id VARCHAR(64) DEFAULT NULL,

  -- ========== JOB TRACKING ==========

  -- Our job system token (if the character was created via a job).
  maybe_origin_job_token VARCHAR(32) DEFAULT NULL,

  -- Third party's job system token (if any).
  maybe_origin_third_party_job_id VARCHAR(64) DEFAULT NULL,

  -- ========== TIMESTAMPS ==========

  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP DEFAULT NULL,

  -- ========== INDICES ==========

  PRIMARY KEY (id),
  UNIQUE KEY (token),
  KEY index_character_token (character_token),
  KEY index_third_party (third_party),
  KEY index_third_party_id (third_party_id),
  KEY index_is_active (is_active)

) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin;
