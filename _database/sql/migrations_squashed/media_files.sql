-- NB: This is a manually squashed view of all the CREATE and ALTER statements,
-- with comments attached to the fields for centralized documentation.

-- noinspection SqlDialectInspectionForFile
-- noinspection SqlNoDataSourceInspectionForFile
-- noinspection SqlResolveForFile

-- This table contains both user uploads and inference or processing results.
--
-- The fields in media_files that should be filterable are:
--    * media_class ("audio", "video", "image", "dimensional")
--    * media_type ("fbx", "glb", "scene_json", "png", "jpg", etc.)
--    * engine_category ("scene", "character", "animation", "object", "image_plane", etc.)
--
CREATE TABLE media_files (
  -- Not used for anything except replication.
  id BIGINT(20) NOT NULL AUTO_INCREMENT,

  -- Effective "primary key" (PUBLIC)
  token VARCHAR(32) NOT NULL,

  -- We don't need an idempotency token!
  -- Store upload idempotency tokens in a separate table.
  -- uuid_idempotency_token VARCHAR(36) NOT NULL,

  -- ========== FOREIGN KEY TO ORIGIN ==========

  -- There is an index on this column.
  -- Broad "category" for where the file came from:
  --   * 'inference' for inference output
  --   * 'processed' for processed file (eg. mp3 encoding, stem splitting, etc.)
  --   * 'upload' for direct user upload (from the filesystem)
  --   * 'device_api' for direct user uploads recorded using Browser/Device APIs.
  --   * 'studio' for storyteller studio jobs
  --   * 'story_engine' (DEPRECATED)
  origin_category VARCHAR(16) NOT NULL,

  -- TODO(bt,2024-01-12): Rename to origin_product.
  -- There is an index on this column.
  -- Product area where the media file originated.
  -- This is not the _model_ that created the thing, this is the _product_.
  -- (The underlying models can change over time.)
  --
  -- This value indicates what product originally created the media file. (Not the ML model or
  -- user upload process.) This will let us scope media files to the product that generated them
  -- and filter them out of unrelated products if necessary (eg. a user probably doesn't want
  -- "Voice Designer" dataset samples in a video generation flow.)
  --
  -- Possible values:
  --   * 'unknown' for legacy records without an associated product
  --   * 'face_animator' for uploads and outputs
  --   * 'face_mirror' for uploads and outputs
  --   * 'vst' for uploads and outputs
  --   * 'studio' for engine renders and outputs
  --   * 'tts' for text to speech outputs
  --   * 'voice_conversion' for uploads or outputs (RVC or SVC)
  --   * 'zs_voice' for uploads or outputs for zero shot voice products
  --   * 'mocap' for files uploaded or processed by motion capture
  --   * 'image_gen' for image generation
  --   * 'video_filter' (DEPRECATED)
  --   * 'workflow' (DEPRECATED)
  origin_product_category VARCHAR(16) NOT NULL DEFAULT "unknown",

  -- What service provided the generation (if any).
  maybe_generation_provider VARCHAR(16) DEFAULT NULL,

  -- For inference that can be tied back to a model, the type of model.
  -- There are multiple indices on this column!
  -- DO NOT EXPOSE THIS TO USERS VIA THE API, as we may leak secrets in doing so.
  -- Possible values:
  --   * 'live_portrait', which doesn't have a value for maybe_origin_model_token (!!!)
  --   * 'rvc_v2'
  --   * 'sad_talker', which doesn't have a value for maybe_origin_model_token (!!!)
  --   * 'so_vits_svc'
  --   * 'tacotron2'
  --   * 'mocap_net'
  --   * 'styletts2'
  --   * 'stable_diffusion_1_5'
  --   * 'gpt_sovits', which is obfuscated in the API
  --   * 'studio', which does not have a value for maybe_origin_model_token (!!!)
  --   * 'vst', which does not have a value for maybe_origin_model_token (!!!)
  --   * 'comfy_ui' (DEPRECATED)
  --   * 'vall_e_x' (DEPRECATED)
  --   * 'rerender' (DEPRECATED)
  --   * (more tome come)
  maybe_origin_model_type VARCHAR(32) DEFAULT NULL,

  -- For inference that can be tied back to a model, the token of the model.
  -- For zero shot models, this may be set as the token for the vector.
  maybe_origin_model_token VARCHAR(32) DEFAULT NULL,

  -- The original filename of the media (if uploaded by a user)
  maybe_origin_filename VARCHAR(255) DEFAULT NULL,

  -- TODO: Remove after `maybe_batch_token` gains use.
  -- Whether this media file was generated as part of a batch
  -- If so, we can look up the batch in a separate query/call to the `batch_generations` table.
  -- We won't hold the batch token in this table since it'll be very sparsely populated.
  is_batch_generated BOOLEAN NOT NULL DEFAULT FALSE,

  -- If the media file is generated as part of a batch, this designates the batch.
  maybe_batch_token VARCHAR(32) DEFAULT NULL,

  -- ========== METADATA ==========

  -- If the file is a user upload (not including studio renders).
  -- Users can see these, but we may want to filter them out of most views.
  is_user_upload BOOLEAN NOT NULL DEFAULT FALSE,

  -- If the file is generated as an intermediate step that we won't share.
  -- Eg. cover image uploads, 3D engine renders, etc.
  is_intermediate_system_file BOOLEAN NOT NULL DEFAULT FALSE,

  -- We can store text transcripts, etc. in other tables and refer back via foreign key.
  -- Titles and even descriptions can go in another table(s): media_file_annotations, media_file_tags, media_file_descriptions, ...
  -- (Not everything would have a text transcript.)

  -- Media files can have optional titles
  maybe_title VARCHAR(255) DEFAULT NULL,

  -- The "cover" image is a media file of type image that severs as a small
  -- example of the media file. Like album art or a user profile picture / avatar.
  -- This is particularly useful for 3D assets and scenes.
  maybe_cover_image_media_file_token VARCHAR(32) DEFAULT NULL,

  -- If this media file was generated by style transferring a video, this is a link to the source video.
  -- The token is a media file token.
  maybe_style_transfer_source_media_file_token VARCHAR(32) DEFAULT NULL,

  -- If this media file was generated by a scene from the engine, this is a link to that file.
  -- The token is a media file token.
  maybe_scene_source_media_file_token VARCHAR(32) DEFAULT NULL,

  -- A flag for NSFW status.
  nsfw_status VARCHAR(32) NOT NULL DEFAULT "unknown",

  -- ========== MEDIA DETAILS ==========

  -- Type of media file:
  --   * TODO(bt): 'audio'/'video'/'image' will eventually become "jpg", "wav", "mp4", etc.
  --   * 'audio' for wav, mp3, etc. (TODO: Deprecate this.)
  --   * 'image' for a variety of video types. (TODO: Deprecate this.)
  --   * 'video' for a variety of video types. (TODO: Deprecate this.)
  --   * 'mocap` for motion capture files (eg. BVH, FBX, etc.)  (TODO: Deprecate this)
  --   * `bvh` for BVH files
  --   * `fbx` for FBX files
  --   * `glb` for GLB files
  --   * `gltf` for GLTF files
  --   * `scene_ron` for SCN.RON files
  --   * `scene_json` for scene files for three.js
  --   * `pmd`
  --   * `vmd`
  --   * `pmx`
  --   * `csv`
  --   * `spz` Gaussian splats
  media_type VARCHAR(16) NOT NULL,

  -- Broad class of media:
  -- This is especially helpful with engine types that map to specific semantics.
  --   * 'unknown' (TODO: This is the default until all records are backfilled.)
  --   * 'audio' for wav, mp3, etc.
  --   * 'image' for a variety of video types.
  --   * 'video' for a variety of video types.
  --   * 'dimensional' for a variety of 3d types
  media_class VARCHAR(16) NOT NULL DEFAULT "unknown",

  -- DEPRECATED / DO NOT USE. THIS FIELD IS NO LONGER RELEVANT.
  -- A media file's possible subtype. Typically used for Storyteller Studio.
  --   * 'mixamo' for mixamo animations (eg. for BVH, GLB, FBX, etc. files)
  --   * 'mocap_net' for mocapnet animations (eg. for BVH files)
  --   * 'scene'
  --   * 'character'
  --   * 'animation'
  -- DO NOT USE THE `maybe_media_subtype` FIELD!
  maybe_media_subtype VARCHAR(32) DEFAULT NULL,

  -- The file's mime type.
  maybe_mime_type VARCHAR(32) DEFAULT NULL,

  -- The file size.
  file_size_bytes INT(10) NOT NULL DEFAULT 0,

  -- The duration in millis, if audio or video.
  maybe_duration_millis INT(10) DEFAULT NULL,

  -- Audio encoder details
  -- Only present if the file was audio or a video that had audio.
  maybe_audio_encoding VARCHAR(32) DEFAULT NULL,

  -- Video encoder details
  -- Only present if the file was a video.
  maybe_video_encoding VARCHAR(32) DEFAULT NULL,

  -- For videos, the original frame width.
  maybe_frame_width INT(5) DEFAULT NULL,

  -- For videos, the original frame height.
  maybe_frame_height INT(5) DEFAULT NULL,

  -- For 3D files, the category they're organized under
  -- This is used as a website filter.
  maybe_engine_category VARCHAR(16) DEFAULT NULL,

  -- For 3D rigs and animations, the type of animation.
  maybe_animation_type VARCHAR(32) DEFAULT NULL,

  -- Optional text transcript for audio or video (especially TTS)
  maybe_text_transcript TEXT DEFAULT NULL,

  -- Optional pointer to the prompt that generated this media file, if relevant.
  maybe_prompt_token VARCHAR(32) DEFAULT NULL,

  -- Checksum of the original media
  -- SHA1 hash [SHA2 = CHAR(64), SHA1 = CHAR(40), MD5 = CHAR(32)]
  -- checksum_sha1 CHAR(40) NOT NULL,

  -- Checksum of the original media
  -- SHA2 hash [SHA2 = CHAR(64), SHA1 = CHAR(40), MD5 = CHAR(32)]
  -- Note that SHA2 is a hash family (SHA-228, SHA-256, SHA-384, SHA-512, SHA-512/224, SHA-512/256, ...)
  -- and produces different lengths output depending on the choice of algorithm.
  checksum_sha2 CHAR(64) NOT NULL,

  -- Whether the image or video has a visible watermark.
  -- If so, we may not need to add a watermark downstream in further processing steps.
  has_watermark BOOLEAN NOT NULL DEFAULT FALSE,

  -- Tracks the thumbnail algorithm/type used for this media file.
  -- NULL = no thumbnail generated yet.
  -- 1 = video thumbnail.
  -- Other values are reserved for future thumbnail algorithms or media-specific types.
  maybe_thumbnail_version TINYINT UNSIGNED DEFAULT NULL,

  -- ========== UPLOAD, TRANSCODING, AND TRUNCATION DETAILS ==========

  -- The hash for the bucket directory that contains the original upload
  -- as well as any transcodings, downsamplings, etc.
  -- The bucket filename for the primary file (not including the directory path) is given by:
  -- `[{maybe_public_bucket_prefix}]{public_bucket_directory_hash}[{maybe_public_bucket_extension}]`
  public_bucket_directory_hash  VARCHAR(32) NOT NULL,

  -- An optional prefix on the bucket filename.
  -- If present, this will be prepended to the beginning of the bucket filename to access the file.
  -- The bucket filename for the primary file (not including the directory path) is given by:
  -- `[{maybe_public_bucket_prefix}]{public_bucket_directory_hash}[{maybe_public_bucket_extension}]`
  maybe_public_bucket_prefix VARCHAR(16) DEFAULT NULL,

  -- An optional appended extension on the bucket filename.
  -- If present, this will be appended to the end of the bucket filename to access the file.
  -- To allow for flexibility, this extension typically will contain a leading period if
  -- the file needs it (eg ".mp4" rather than "mp4")!
  -- The bucket filename for the primary file (not including the directory path) is given by:
  -- `[{maybe_public_bucket_prefix}]{public_bucket_directory_hash}[{maybe_public_bucket_extension}]`
  maybe_public_bucket_extension VARCHAR(16) DEFAULT NULL,

  -- This is a migration flag that denotes whether this media file is stored in AWS.
  -- If not, it's stored in GCP.
  is_in_aws BOOLEAN NOT NULL DEFAULT false,

  -- This is a migration flag that denotes that weight is not stored in GCP.
  is_not_in_gcp BOOLEAN NOT NULL DEFAULT false,

  -- NB: Removed, since this can be derived.
  -- The directory this media is uploaded to will be exclusive for this file.
  -- Only this given record will live in this bucket, but the directory may include
  -- other transcodings or truncations.
  -- public_bucket_directory_full_path VARCHAR(255) NOT NULL,

  -- We'll likely transcode (and potentially truncate) most media given to us.
  -- This will store a json-encoded struct that details the changes.
  -- TEXT = 65,535 bytes (64 KiB), ~= 4 bytes per UTF-8 character, ~ 16383 characters.
  extra_file_modification_info TEXT DEFAULT NULL,

  -- ========== CREATOR DETAILS AND PREFERENCES ==========

  -- Foreign key to user
  maybe_creator_user_token VARCHAR(32) DEFAULT NULL,

  -- Based on a cookie sent by the frontend.
  -- We'll save this even if the user is logged in.
  maybe_creator_anonymous_visitor_token VARCHAR(32) DEFAULT NULL,

  -- For abuse tracking.
  -- Wide enough for IPv4/6
  creator_ip_address VARCHAR(40) NOT NULL,

  -- The creator can set a desired visibility for their data.
  -- This does not always apply to every upload type.
  -- Additionally, some upload types may require moderator approval prior
  -- to being publicly listed, and this field has no bearing on that.
  -- NB: DO NOT CHANGE THE ORDER OF THE ENUM VALUES DURING SCHEMA MIGRATIONS.
  creator_set_visibility ENUM(
    'public',
    'hidden',
    'private'
  ) NOT NULL DEFAULT 'public',

  -- The synthetic id associated with this result.
  -- These ids are incremented on a per-user basis to help users
  -- sequence their own work. They serve no other purpose.
  -- "file" synthetic ids are incremented over all media files
  maybe_creator_file_synthetic_id BIGINT(20) DEFAULT NULL,

  -- "category" synthetic ids are incremented over a category type
  maybe_creator_category_synthetic_id BIGINT(20) DEFAULT NULL,

  -- ========== MODERATION DETAILS ==========

  -- The last moderator that made changes last.
  -- We should also build an audit table to supersede this.
  maybe_mod_user_token VARCHAR(32) DEFAULT NULL,

  -- ========== INFERENCE METADATA, DC, ROUTING, DEBUGGING ==========

  -- For inference and processing, whether we generated this result from
  -- our own data center (vs. cloud).
  is_generated_on_prem BOOLEAN NOT NULL DEFAULT FALSE,

  -- For inference or processing, which worker handled the processing.
  -- Worker hostname (linux hostname, k8s pod name)
  generated_by_worker VARCHAR(255) DEFAULT NULL,

  -- For inference or processing, which cluster handled the processing.
  -- Cluster name (k8s)
  generated_by_cluster VARCHAR(255) DEFAULT NULL,

  -- ========== TIMESTAMPS ==========

  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  -- If this is removed by a mod or the creator.
  user_deleted_at TIMESTAMP NULL,
  mod_deleted_at TIMESTAMP NULL,

  -- INDICES --
  PRIMARY KEY (id),
  UNIQUE KEY (token),
  KEY index_origin_category (origin_category),
  KEY index_origin_product_category (origin_product_category),
  KEY index_maybe_origin_model_type (maybe_origin_model_type),
  KEY fk_maybe_origin_model_token (maybe_origin_model_token),
  KEY fk_maybe_origin_model_type_and_token (maybe_origin_model_type, maybe_origin_model_token),
  KEY index_maybe_batch_token (maybe_batch_token),
  KEY index_is_user_upload (is_user_upload),
  KEY index_is_intermediate_system_file (is_intermediate_system_file),
  KEY index_maybe_scene_source_media_file_token (maybe_scene_source_media_file_token),
  KEY index_nsfw_status (nsfw_status),
  KEY index_media_type (media_type),
  KEY index_media_class (media_class),
  KEY index_maybe_engine_category (maybe_engine_category),
  KEY fk_maybe_prompt_token (maybe_prompt_token),
  KEY index_checksum_sha2 (checksum_sha2),
  KEY index_is_in_aws (is_in_aws),
  KEY fk_maybe_creator_user_token (maybe_creator_user_token),
  KEY fk_maybe_mod_user_token (maybe_mod_user_token),
  KEY index_creator_ip_address (creator_ip_address),
  KEY index_user_deleted_at (user_deleted_at),
  KEY index_mod_deleted_at (mod_deleted_at),
  KEY index_media_files_created_at (created_at),
  KEY index_media_files_updated_at (updated_at)

) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin;
