-- noinspection SqlDialectInspectionForFile
-- noinspection SqlNoDataSourceInspectionForFile
-- noinspection SqlResolveForFile

CREATE TABLE generic_inference_jobs (

  -- Not used for anything except replication.
  id BIGINT(20) NOT NULL AUTO_INCREMENT,

  -- Effective "primary key" (PUBLIC)
  -- This is so the in-progress results can be looked up by the UI.
  token VARCHAR(32) NOT NULL,

  -- Idempotency token from client
  -- This is so the frontend client doesn't submit duplicate jobs.
  uuid_idempotency_token VARCHAR(36) NOT NULL,

  -- ========== INFERENCE DETAILS ==========

  -- There is an index on this column.
  -- The new enum for the type of job, which will eventually replace `inference_category` and `maybe_model_type`.
  -- This isn't fully supported yet in the inference-job, but we'll start populating it and adding logic around it.
  -- We'll start this out as nullable, then migrate the old rows with a default column value.
  --
  -- Fal jobs have the type `fal_queue`.
  job_type VARCHAR(32) DEFAULT NULL,

  -- There is an index on this column.
  -- This is a user-facing and analytics-facing column that describes what product area the job
  -- is attributed to. For example, this will help us separate "video style transfer" from
  -- "storyteller studio" and also separate "live portrait" from "webcam live portrait".
  product_category VARCHAR(32) DEFAULT NULL,

  -- There is an index on this column.
  -- NB: This is becoming a problematic field and is becoming conflated with `maybe_model_type`.
  -- We're using this to handle job dispatching, but the latter is being used to load container
  -- dependencies at startup (even if it isn't a real model type or a polymorphic foreign key).
  -- This is pretty gross and horrible.
  --
  -- Broad category of inference
  -- Examples (may not be up to date):
  --  * text_to_speech
  --  * voice_conversion
  --  * image_generation
  --  * video_generation  
  --  * background_removal
  inference_category VARCHAR(32) NOT NULL,

  -- If the job is externally enqueued, this is the third-party service
  -- responsible for the job. Typically, we won't run an inference job for
  -- jobs being run on a third party.
  maybe_external_third_party VARCHAR(16) DEFAULT NULL,

  -- If the job is externally enqueued, this is the ID the third-party
  -- service uses.
  maybe_external_third_party_id VARCHAR(64) DEFAULT NULL,

  -- There is an index on this column.
  -- NB: See notes on inference_category. This is becoming a problematic field. We're using
  -- this to load the container spin-up arguments and dependencies, but the former is being
  -- used to dispatch the job. `inference_category` is the one that should probably go away,
  -- and this column should be renamed to `inference_job_type`.
  --
  -- Potential part of the composite foreign key to the primary model being used, if any.
  -- This will normally live in `maybe_inference_args`, but in this case, it's useful for
  -- running easy database analytical queries.
  --
  -- Examples (may not be up to date):
  --    * rvc_v2
  --    * so_vits_svc
  --    * tacotron2
  --    * vits
  maybe_model_type VARCHAR(32) DEFAULT NULL,

  -- There is an index on this column.
  -- Potential part of the composite foreign key to the primary model being used, if any.
  -- This will normally live in `maybe_inference_args`, but in this case, it's useful for
  -- running easy database analytical queries.
  maybe_model_token VARCHAR(32) DEFAULT NULL,

  -- If the inference job takes some other kind of entity, this will be the token
  -- Not all inference jobs have record-like input sources.
  maybe_input_source_token VARCHAR(32) DEFAULT NULL,

  -- If the inference job takes some other kind of entity, this will be the type of the
  -- token. For now, this is just `media_upload`.
  -- Not all inference jobs have record-like input sources.
  maybe_input_source_token_type VARCHAR(32) DEFAULT NULL,

  -- Polymorphic arguments payload that depends on the type of inference job.
  -- TEXT = 65,535 bytes (64 KiB), ~= 4 bytes per UTF-8 character, ~ 16383 characters.
  maybe_inference_args TEXT DEFAULT NULL,

  -- For text-based workloads, the raw, unprocessed user input.
  -- TEXT = 65,535 bytes (64 KiB), ~= 4 bytes per UTF-8 character, ~ 16383 characters.
  maybe_raw_inference_text TEXT DEFAULT NULL,

  -- For download-related jobs, this is the URL
  -- This is nullable because not all inference jobs have a download URL.
  -- The length of 1024 is arbitrary, but we shouldn't need anything longer.
  maybe_download_url VARCHAR(1024) DEFAULT NULL,

  -- For download-related jobs, this is the cover image to set.
  -- This is nullable because not all inference jobs have a download URL.
  -- And furthermore, not all download URLs have a cover image.
  maybe_cover_image_media_file_token VARCHAR(32) DEFAULT NULL,

  -- If we pre-constructed a prompt, this will be copied to the resultant media generated.
  -- This is especially important for Fal-related jobs and endpoints. We need this for keeping
  -- track of all the prompt details, context images, etc.
  maybe_prompt_token VARCHAR(30) DEFAULT NULL,

  -- A migration flag we can control from the backend API service which will tell
  -- the worker where to store the results. If false, GCP. If true, AWS.
  store_in_aws BOOLEAN NOT NULL DEFAULT FALSE,

  -- ========== SUCCESS CASE ==========

  -- The type of the object will vary based on the type of the upload,
  -- and we may include heuristics that auto-detect types in the future
  on_success_result_entity_type VARCHAR(32) DEFAULT NULL,

  -- If the job completes successfully, this is the result token.
  -- This is only populated on a successful result.
  on_success_result_entity_token VARCHAR(32) DEFAULT NULL,

  -- If the job completes successfully, this is the batch token (ie. when
  -- several results are created).
  -- Only populated if there are actual batches generated.
  on_success_result_batch_token VARCHAR(32) DEFAULT NULL,

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

  -- ========== PREMIUM FEATURES METADATA ==========

  -- The maximum duration for generated audio or video in seconds.
  -- Zero is implied to be the default value, which is typically 12 seconds.
  -- A negative value implies "unlimited".
  max_duration_seconds INTEGER NOT NULL DEFAULT 0,

  -- ========== WORKLOAD SOURCE AND PRIORITY ==========

  -- Priority *increases*, so a level of 2 will be higher than 1.
  -- These are the level semantics currently:
  --   - All jobs from anonymous FakeYou users have level 0.
  --   - All jobs from logged in FakeYou users have level 1.
  --   - All jobs from Twitch TTS (unpaid) have level 10 (ten).
  --   - (There will be future levels for paid Twitch and social FakeYou rewards.)
  priority_level SMALLINT UNSIGNED NOT NULL DEFAULT 0,

  -- For non-premium workloads (or some other workloads), we may require that the
  -- user remains on the website. This will help us kill jobs if the user leaves.
  -- The state for this keepalive signal will be job-type dependent and may live
  -- in Redis or some other system. Typically the frontend job status polling will
  -- populate this keepalive signal (eg. in a Redis key with TTL).
  is_keepalive_required BOOLEAN NOT NULL DEFAULT FALSE,

  -- TODO: add is_for_storyteller_product
  is_from_premium_user BOOLEAN NOT NULL DEFAULT FALSE,
  is_from_api_user BOOLEAN NOT NULL DEFAULT FALSE,
  is_for_twitch BOOLEAN NOT NULL DEFAULT FALSE,

  -- If credits were spent for this job, this references the corresponding wallet ledger entry.
  maybe_wallet_ledger_entry_token VARCHAR(32) DEFAULT NULL,

  -- ========== DEVELOPMENT AND DEBUGGING METADATA ==========

  -- If true, the request gets a "debug" flag, which may do different
  -- things depending on the type of work. This doesn't really have any
  -- specific meaning -- it can be used to flag for anything -- but should
  -- typically be used for one-off debugging and not a part of the normal
  -- product surface area. Contrast this with `maybe_routing_tag`, which
  -- forces the job onto a specific physical server: this might be a flag
  -- deployed to handle debugging across the entire fleet.
  is_debug_request BOOLEAN NOT NULL DEFAULT FALSE,

  -- If set, the request gets processed by a special "tagged" worker
  -- that matches this tag. The ordinary workers will ignore this work.
  -- The tag is typically added via a special HTTP header when the work
  -- is enqueued. In practice, this means we can canary deploy or cordon
  -- off special workers to handle certain jobs.
  maybe_routing_tag VARCHAR(64) DEFAULT NULL,

  -- ========== JOB SYSTEM DETAILS ==========

  -- Jobs begin as "pending", then transition to other states.
  --
  --  * Pending = job is ready to go
  --  * Started = job is running
  --  * Complete_Success = job is done (success)
  --  * Complete_Failure = job is done (permanent failure, eg. a Face Animator job without a face)
  --  * Attempt_Failed = job failed but may retry.
  --  * Dead = job failed permanently (ie. exhausted retries)
  --  * Cancelled_By_User = the user canceled their own job
  --  * Cancelled_By_System = the system terminated the job (ie. load shedding, user account deletion, etc.)
  --
  -- Pending -> Started -> Complete_Success
  --                    |-> Complete_Failure
  --                    \-> Attempt_Failed -> Started -> { Complete, Failed, Dead }
  status ENUM(
    'pending',
    'started',
    'complete_success',
    'complete_failure',
    'attempt_failed',
    'dead',
    'cancelled_by_user',
    'cancelled_by_system'
  ) NOT NULL DEFAULT 'pending',

  -- We can track this against a "max_attempt_count"
  attempt_count SMALLINT UNSIGNED NOT NULL DEFAULT 0,

  -- If the user chooses to no longer display or poll the job, we mark this flag true.
  -- This should only be set for terminal state (completed or failed) jobs.
  -- We use this flag to remove the job from the user's view.
  is_dismissed_by_user BOOLEAN NOT NULL DEFAULT FALSE,

  -- If there is a failure, tell the user why.
  -- This isn't localized or very friendly to present to the user.
  failure_reason VARCHAR(512) DEFAULT NULL,

  -- Optional internal-only debugging information in the case of failure.
  internal_debugging_failure_reason VARCHAR(512) DEFAULT NULL,

  -- An enum-like key to present the frontend with a failure class in an
  -- i18n-friendly way. The javascript/frontend can use these as indices
  -- into descriptive, broadly-localized error messages.
  --
  --   * 'face_not_detected' for images or videos that do not have a detectable
  --                         face (SadTalker, Wav2Lip, etc.)
  --
  --   * 'keep_alive_elapsed' when users walk away from their inference job and
  --                          the workload class expects for them to remain
  --
  --   * 'not_yet_implemented' error for developers during feature development
  --                           and prototyping. Should ideally never happen in
  --                           production
  --
  --   * 'retryable_worker_error' for generic worker errors (full filesystem,
  --                              etc.) that can be retried. (We don't need to
  --                              tell the user why the job failed.)
  --
  frontend_failure_category VARCHAR(32) DEFAULT NULL,

  -- On success, we populate how long the job execution took in milliseconds.
  -- We have this because 1) the job system timestamps are second-resolution,
  -- and 2) the structure of the jobs executor may change, potentially changing
  -- derived execution time analytics with it.
  success_execution_millis INT(10) UNSIGNED DEFAULT NULL,

  -- This is only the inference portion and does not include downloads, uploads,
  -- or any subsequent processing.
  success_inference_execution_millis INT(10) UNSIGNED DEFAULT NULL,

  -- TODO: Remove once `assigned_worker` column is added
  --   and existing queries for this column are removed.
  -- The last worker (hostname or pod name) to touch the job, either in the case of success or failure.
  last_assigned_worker VARCHAR(255) DEFAULT NULL,

  -- Worker hostname (linux hostname, k8s pod name)
  -- Assigned when a worker picks up the job
  -- Reassigned if the job fails and gets picked up again
  assigned_worker VARCHAR(128) DEFAULT NULL,

  -- Cluster name (k8s)
  -- Assigned when a worker picks up the job
  -- Reassigned if the job fails and gets picked up again
  assigned_cluster VARCHAR(128) DEFAULT NULL,

  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  -- Failed jobs will set a next attempt time.
  -- Subsequent tries can increase the timeout.
  -- Failures because of permissions require human intervention => [retry_at=null].
  -- Failures because of invalid files are dead => [status=dead].
  retry_at TIMESTAMP NULL,

  -- Set when the job first starts executing
  first_started_at TIMESTAMP NULL,

  -- Set when the job is successfully completed
  successfully_completed_at TIMESTAMP NULL,

  -- INDICES --
  PRIMARY KEY (id),
  UNIQUE KEY (token),
  UNIQUE KEY (uuid_idempotency_token),
  UNIQUE KEY (maybe_external_third_party, maybe_external_third_party_id),
  KEY index_job_type (job_type),
  KEY index_product_category (product_category),
  KEY index_inference_category (inference_category),
  KEY index_maybe_model_type_and_maybe_model_token (maybe_model_type, maybe_model_token),
  KEY index_maybe_model_type (maybe_model_type),
  KEY index_maybe_external_third_party_id (maybe_external_third_party_id),
  KEY fk_maybe_model_token (maybe_model_token),
  KEY fk_maybe_input_source_token (maybe_input_source_token),
  KEY fk_maybe_input_source_token_and_type (maybe_input_source_token, maybe_input_source_token_type),
  KEY fk_on_success_result_entity_token (on_success_result_entity_token),
  KEY fk_maybe_creator_user_token (maybe_creator_user_token),
  KEY index_maybe_creator_anonymous_visitor_token (maybe_creator_anonymous_visitor_token),
  KEY index_creator_ip_address (creator_ip_address),
  KEY index_priority_level (priority_level),
  KEY index_is_debug_request (is_debug_request),
  KEY index_maybe_routing_tag (maybe_routing_tag),
  KEY index_status (status),
  KEY index_generic_inference_jobs_created_at (created_at)

) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin;
