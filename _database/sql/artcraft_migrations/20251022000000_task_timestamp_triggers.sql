-- None of the UPDATE statements in the `sqlite_tasks` crate set `updated_at` or `completed_at`, so before
-- this migration `updated_at` stayed equal to `created_at` and `completed_at` stayed NULL forever. The
-- frontend sorts and labels failed and finished tasks with those columns, so it showed the time a task was
-- created instead of the time it finished. These triggers keep both columns right without touching the
-- compile-time checked queries.

-- Any change to a row refreshes `updated_at`, unless the statement already set it itself.
CREATE TRIGGER tasks_touch_updated_at
AFTER UPDATE ON tasks
FOR EACH ROW
WHEN NEW.updated_at = OLD.updated_at
BEGIN
    UPDATE tasks SET updated_at = unixepoch('now') WHERE id = NEW.id;
END;

-- The first time a task reaches a terminal status, stamp `completed_at`.
CREATE TRIGGER tasks_stamp_completed_at
AFTER UPDATE OF task_status ON tasks
FOR EACH ROW
WHEN NEW.completed_at IS NULL
 AND NEW.task_status IN (
    'complete_success',
    'complete_failure',
    'dead',
    'cancelled_by_user',
    'cancelled_by_provider',
    'cancelled_by_us'
 )
BEGIN
    UPDATE tasks SET completed_at = unixepoch('now') WHERE id = NEW.id;
END;
