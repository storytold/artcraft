CREATE UNIQUE INDEX IF NOT EXISTS unique_wavespeed_prediction
ON tasks (provider, provider_job_id)
WHERE provider = 'wavespeed' AND provider_job_id IS NOT NULL AND provider_job_id != '';

CREATE INDEX IF NOT EXISTS tasks_status_provider ON tasks (task_status, provider);

CREATE TRIGGER IF NOT EXISTS preserve_terminal_task_results
BEFORE UPDATE OF
    on_complete_batch_token, on_complete_primary_media_file_token,
    on_complete_primary_media_file_class, on_complete_primary_media_file_cdn_url,
    on_complete_primary_media_file_thumbnail_url_template,
    on_failure_type, on_failure_message
ON tasks
WHEN OLD.task_status IN (
    'complete_success', 'complete_failure', 'dead',
    'cancelled_by_user', 'cancelled_by_provider', 'cancelled_by_us'
)
BEGIN
    SELECT RAISE(IGNORE);
END;
