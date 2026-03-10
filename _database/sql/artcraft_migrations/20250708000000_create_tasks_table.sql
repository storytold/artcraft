-- noinspection SqlDialectInspectionForFile
--
-- NB: This version needs to be bumped even if just adding or changing comments!
--  Failure to do so will cause Windows to segfault at start. (This is horrible!)
--
-- NB: `app_state_dir.rs` contains the file version number.
--
-- Migration history:
--   tasks_v1.sqlite - initial version
--   tasks_v2.sqlite - added model_type (nullable)
--   tasks_v3.sqlite - added frontend_caller, comments
--   tasks_v4.sqlite - added is_dismissed_by_user
--   tasks_v5.sqlite - added five fields:
--      on_complete_batch_token,
--      on_complete_primary_media_file_token,
--      on_complete_primary_media_file_class,
--      on_complete_primary_media_file_cdn_url,
--      on_complete_primary_media_file_thumbnail_url_template,
--   tasks_v6.sqlite - added two fields:
--      on_failure_type
--      on_failure_message

CREATE TABLE tasks (
    -- Task auto-incrementing primary key.
    -- We don't use this.
    id TEXT NOT NULL PRIMARY KEY,

    -- TaskStatus enum
    -- This is how the job system manages job states.
    -- e.g. pending, started, complete_success, dead, etc.
    task_status TEXT NOT NULL,

    -- TaskType enum
    -- e.g. image_generation, video_generation, etc.
    task_type TEXT NOT NULL,

    -- TaskModelType enum
    -- e.g. flux_1_dev, veo_2, etc.
    model_type TEXT,

    -- GenerationProvider enum
    -- Together with `provider_job_id`, this creates a foreign key lookup to the job.
    -- e.g. 'artcraft', 'fal', 'sora', etc.
    provider TEXT,

    -- The primary key for the job in the provider's system.
    provider_job_id TEXT,

    -- OPTIONAL.
    -- Tell the job system which caller initiated the task.
    -- e.g. 'canvas'
    frontend_caller TEXT,

    -- OPTIONAL.
    -- An arbitrary opaque identifier that frontend can set.
    frontend_subscriber_id TEXT,

    -- OPTIONAL.
    -- An opaque JSON payload set by the frontend subscriber that
    -- will be re-emitted back to the frontend.
    frontend_subscriber_payload TEXT,

    -- Whether the user has dismissed the task from view.
    is_dismissed_by_user INTEGER NOT NULL DEFAULT 0,

    -- OPTIONAL.
    -- When the generation completes, the batch token (if any).
    -- This will point to a collection of multiple files.
    on_complete_batch_token TEXT,

    -- OPTIONAL.
    -- When the generation completes, the media token of the "primary" media file.
    -- We'll probably always generate homogenous types, but just in case this is the first or primary item in a batch.
    on_complete_primary_media_file_token TEXT,

    -- OPTIONAL.
    -- When the generation completes, the file type of the primary media file.
    -- We'll probably always generate homogenous types, but just in case this is the first or primary item in a batch.
    on_complete_primary_media_file_class TEXT,

    -- OPTIONAL.
    -- The URL to the media file.
    on_complete_primary_media_file_cdn_url TEXT,

    -- OPTIONAL.
    -- The URL template for the thumbnail of the primary media file.
    on_complete_primary_media_file_thumbnail_url_template TEXT,

    -- OPTIONAL.
    -- An enum-like string describing the failure reason (even for non-terminal failures).
    -- The enum is `TaskFailureType`, which is a close analogue of the backend API's `FrontendFailureCategory`.
    on_failure_type TEXT,

    -- OPTIONAL.
    -- A human-readable message describing the failure reason (even for non-terminal failures).
    on_failure_message TEXT,

    created_at INTEGER NOT NULL DEFAULT (unixepoch('now')),
    updated_at INTEGER NOT NULL DEFAULT (unixepoch('now')),
    completed_at INTEGER DEFAULT NULL
);

-- Unique Indices
CREATE UNIQUE INDEX idx_tasks_on_provider_job_id ON tasks(provider_job_id);

-- Indices
CREATE INDEX idx_tasks_on_status ON tasks(task_status);
CREATE INDEX idx_tasks_on_provider ON tasks(provider);
