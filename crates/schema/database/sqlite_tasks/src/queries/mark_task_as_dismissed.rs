use crate::connection::TaskDbConnection;
use crate::error::SqliteTasksError;
use tokens::tokens::sqlite::tasks::TaskId;

/// Returns true if rows were updated.
pub async fn mark_task_as_dismissed(
  db: &TaskDbConnection,
  task_id: &TaskId,
) -> Result<bool, SqliteTasksError> {

  // TODO(bt,2025-07-12): Fix this. The sqlx mysql queries never required temporaries
  let task_id_temp = task_id.as_str();

  // TODO(bt,2025-07-15): We can't set a LIMIT without a certain compiler flag for SQLite ?
  let query = sqlx::query!(r#"
    UPDATE tasks
    SET is_dismissed_by_user = 1
    WHERE id = ?
  "#,
      task_id_temp,
  );

  let res = query.execute(db.get_pool()).await?;
  let rows_updated = res.rows_affected() > 0;

  Ok(rows_updated)
}
