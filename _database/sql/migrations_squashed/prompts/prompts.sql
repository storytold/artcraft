-- NB: This is a manually squashed view of all the CREATE and ALTER statements,
-- with comments attached to the fields for centralized documentation.

-- noinspection SqlDialectInspectionForFile
-- noinspection SqlNoDataSourceInspectionForFile
-- noinspection SqlResolveForFile

-- Table to store prompts as a first class entity.
-- Duplication of the same prompt is totally fine.
CREATE TABLE prompts (
  -- Not used for anything except replication.
  id BIGINT(20) NOT NULL AUTO_INCREMENT,

  -- ========== PRIMARY, FOREIGN KEYS, and POLYMORPHISM ==========

  -- Effective "primary key" of the prompt
  token VARCHAR(32) NOT NULL,

  -- Original product to which the prompt applied.
  -- Prompts may or may not be compatible across products.
  -- Possible values:
  --  * 'artcraft_app'
  --  * 'stable_diffusion' (legacy)
  --  * 'comfy_ui' (legacy)
  prompt_type VARCHAR(16) NOT NULL,

  -- What type of model was used to generate the result.
  -- NB: We're conflating prompts with outputs, but in a
  -- sense the model is inextricably part of the prompt.
  --
  -- Represented by the `CommonModelType` enum.
  maybe_model_type VARCHAR(32) DEFAULT NULL,

  -- What service provided the generation.
  maybe_generation_provider VARCHAR(16) NOT NULL,

  -- Whoever created the prompt
  maybe_creator_user_token VARCHAR(32) DEFAULT NULL,

  -- Whoever created the prompt (anonymous user tracking)
  maybe_anonymous_visitor_token VARCHAR(32) DEFAULT NULL,

  -- ========== PROMPT DETAILS ==========

  -- The positive prompt (optional)
  -- TEXT = 65,535 bytes (64 KiB), ~= 4 bytes per UTF-8 character, ~ 16383 characters.
  maybe_positive_prompt TEXT DEFAULT NULL,

  -- The negative prompt (optional)
  -- TEXT = 65,535 bytes (64 KiB), ~= 4 bytes per UTF-8 character, ~ 16383 characters.
  maybe_negative_prompt TEXT DEFAULT NULL,

  -- Polymorphic arguments payload that depends on the type of inference job.
  -- TEXT = 65,535 bytes (64 KiB), ~= 4 bytes per UTF-8 character, ~ 16383 characters.
  maybe_other_args TEXT DEFAULT NULL,

  -- ========== GENERATION PARAMETERS ==========

  -- Represented by the enum `CommonGenerationMode`.
  -- The generation mode (eg. keyframe, reference, inpaint, etc.)
  maybe_generation_mode VARCHAR(24) DEFAULT NULL,

  -- Represented by the enum `CommonAspectRatio`.
  -- The aspect ratio for the prompt (eg. square, auto, wide_three_by_two, etc.)
  maybe_aspect_ratio VARCHAR(24) DEFAULT NULL,

  -- Represented by the enum `CommonResolution`.
  -- The resolution for the prompt (eg. four_k, 720p, etc.)
  maybe_resolution VARCHAR(16) DEFAULT NULL,

  -- TODO: Let's change this to an integer before writing to it.
  -- The duration (eg. 8s, 16s, 2m, etc.)
  -- Not an integer because we want to potentially support other units
  maybe_duration VARCHAR(8) DEFAULT NULL,

  -- The number of outputs to generate (0-255)
  maybe_batch_count TINYINT UNSIGNED DEFAULT NULL,

  -- Whether to generate audio
  maybe_generate_audio BOOLEAN DEFAULT NULL,

  -- ========== ABUSE TRACKING ==========

  -- For abuse tracking.
  -- Wide enough for IPv4/6
  creator_ip_address VARCHAR(40) NOT NULL,

  -- ========== TIMESTAMPS ==========

  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

  -- INDICES --
  PRIMARY KEY (id),
  UNIQUE KEY (token),
  KEY index_maybe_creator_user_token (maybe_creator_user_token),
  KEY index_created_at (created_at)

) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin;
