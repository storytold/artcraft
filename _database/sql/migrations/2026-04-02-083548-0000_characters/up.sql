-- noinspection SqlDialectInspectionForFile
-- noinspection SqlNoDataSourceInspectionForFile
-- noinspection SqlResolveForFile

-- Characters are reusable entities that can be referenced in video/image generations.
-- A character is created from one or more reference images and registered with third-party
-- systems (e.g. Kinovi/Seedance) that support character-based generation.
CREATE TABLE characters (
  -- Not used for anything except replication (private, not even used in queries)
  id BIGINT(20) NOT NULL AUTO_INCREMENT,

  -- Public-facing "primary key" (PUBLIC)
  token VARCHAR(32) NOT NULL,

  -- The type or "features" of the character.
  character_type VARCHAR(24) NOT NULL,

  -- Whether the character has been fully created and is available for use.
  -- A character may exist in the database before its creation job completes.
  is_active BOOLEAN NOT NULL DEFAULT false,

  -- ========== CHARACTER DETAILS ==========

  -- User's display name for the character.
  character_name VARCHAR(255) DEFAULT NULL,

  -- Optional user description of the character.
  maybe_description VARCHAR(512) DEFAULT NULL,

  -- ========== MEDIA ==========

  -- Avatar image (cropped to face, ideally).
  maybe_avatar_media_token VARCHAR(32) DEFAULT NULL,

  -- Full-size reference image.
  maybe_full_image_media_token VARCHAR(32) DEFAULT NULL,

  -- TEMPORARY FOR GOING FAST :
  -- WE'LL NEED TO BREAK THIS INTO ANOTHER TABLE IF WE WANT TO SUPPORT MULTIPLE IMAGES.
  -- Image the character was originally created with.
  maybe_original_upload_media_token VARCHAR(32) DEFAULT NULL,

  -- ========== CREATOR ==========

  -- The user who created this character.
  maybe_creator_user_token VARCHAR(32) DEFAULT NULL,

  -- For abuse tracking.
  creator_ip_address VARCHAR(40) NOT NULL,

  -- ========== KINOVI (TEMPORARY) ==========

  -- TEMPORARY FOR GOING FAST :
  -- IDEALLY WE MOVE THIS TO A SEPARATE TABLE.
  -- The identifier in the third-party system.
  -- e.g. Kinovi's "char_1774752056469_2wlxoq"
  kinovi_character_id VARCHAR(64) DEFAULT NULL,

  -- TEMPORARY FOR GOING FAST :
  -- IDEALLY WE MOVE THIS TO A SEPARATE TABLE.
  -- The name used by the third party.
  -- Important for Kinovi since characters are referenced by name in prompts.
  kinovi_character_name VARCHAR(255) DEFAULT NULL,

  -- TEMPORARY FOR GOING FAST :
  -- IDEALLY WE MOVE THIS TO A SEPARATE TABLE.
  -- This might be the upstream third party of kinovi.
  -- e.g. Kinovi's assetId "asset-20260329104101-kk5kl"
  maybe_kinovi_asset_id VARCHAR(64) DEFAULT NULL,

  -- TEMPORARY FOR GOING FAST :
  -- IDEALLY WE MOVE THIS TO A SEPARATE TABLE.
  -- Our job system token (if the character was created via a job).
  maybe_generic_inference_job_token VARCHAR(32) DEFAULT NULL,

  -- Maybe this doesn't exist
  -- -- TEMPORARY FOR GOING FAST :
  -- -- IDEALLY WE MOVE THIS TO A SEPARATE TABLE.
  -- -- Third party's job system token (if any).
  -- maybe_kinovi_job_id VARCHAR(64) DEFAULT NULL,

  -- ========== TIMESTAMPS ==========

  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP DEFAULT NULL,

  -- ========== INDICES ==========

  PRIMARY KEY (id),
  UNIQUE KEY (token),
  KEY index_character_type (character_type),
  KEY index_maybe_creator_user_token (maybe_creator_user_token),
  KEY index_maybe_creator_user_token_active (maybe_creator_user_token, is_active),
  KEY index_is_active (is_active),
  KEY index_kinovi_character_id (kinovi_character_id),
  KEY index_maybe_generic_inference_job_token (maybe_generic_inference_job_token),
  KEY index_created_at (created_at),
  KEY index_deleted_at (deleted_at)

) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin;
