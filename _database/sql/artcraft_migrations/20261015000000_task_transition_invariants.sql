-- Provider job IDs are only unique within a provider.
DROP INDEX idx_tasks_on_provider_job_id;
CREATE UNIQUE INDEX idx_tasks_on_provider_job_id ON tasks(provider, provider_job_id);
-- Preserve uniqueness for legacy rows whose provider is unknown.
CREATE UNIQUE INDEX idx_tasks_on_unknown_provider_job_id ON tasks(provider_job_id)
WHERE provider IS NULL;

-- A late polling response must not resurrect cancelled tasks or overwrite a
-- terminal result. RAISE(IGNORE) also makes rows_affected() return zero, so
-- callers can suppress completion/failure events for rejected transitions.
CREATE TRIGGER tasks_preserve_terminal_status
BEFORE UPDATE OF task_status ON tasks
WHEN OLD.task_status IN (
  'complete_success', 'complete_failure', 'dead',
  'cancelled_by_user', 'cancelled_by_provider', 'cancelled_by_us'
)
BEGIN
  SELECT RAISE(IGNORE);
END;

-- Maintain timestamps in the same transaction as every status transition,
-- including bulk cancellation and updates addressed by provider/job ID.
CREATE TRIGGER tasks_record_status_transition
AFTER UPDATE OF task_status ON tasks
WHEN NEW.task_status != OLD.task_status
BEGIN
  UPDATE tasks
  SET updated_at = unixepoch('now'),
      completed_at = CASE
        WHEN NEW.task_status IN (
          'complete_success', 'complete_failure', 'dead',
          'cancelled_by_user', 'cancelled_by_provider', 'cancelled_by_us'
        ) THEN COALESCE(OLD.completed_at, unixepoch('now'))
        ELSE OLD.completed_at
      END
  WHERE id = NEW.id;
END;
