CREATE TRIGGER preserve_terminal_task_status
BEFORE UPDATE OF task_status ON tasks
WHEN OLD.task_status IN (
    'complete_success', 'complete_failure', 'dead',
    'cancelled_by_user', 'cancelled_by_provider', 'cancelled_by_us'
)
BEGIN
    SELECT RAISE(IGNORE);
END;
