use crate::connection::TaskDbConnection;
use crate::error::SqliteTasksError;

/// Abandon all in-progress tasks.
/// Marked as user cancellation.
pub async fn nuke_all_tasks(
  db: &TaskDbConnection,
) -> Result<bool, SqliteTasksError> {

  // TODO(bt,2025-07-15): We can't set a LIMIT without a certain compiler flag for SQLite ?
  let query = sqlx::query!(r#"
    UPDATE tasks
    SET task_status = "cancelled_by_user"
    WHERE task_status NOT IN (
        "complete_success",
        "complete_failure",
        "dead",
        "cancelled_by_user",
        "cancelled_by_provider",
        "cancelled_by_us"
    )
  "#);

  let res = query.execute(db.get_pool()).await?;
  let rows_updated = res.rows_affected() > 0;

  Ok(rows_updated)
}
