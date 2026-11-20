use crate::connection::TaskDbConnection;
use crate::error::SqliteTasksError;
use enums::tauri::tasks::task_status::TaskStatus;
use tokens::tokens::sqlite::tasks::TaskId;

/// Read and parse one task status, returning absence for a missing task and errors for unknown statuses.
pub async fn get_task_status(db: &TaskDbConnection, task_id: &TaskId) -> Result<Option<TaskStatus>, SqliteTasksError> {
  let maybe_status: Option<String> = sqlx::query_scalar("SELECT task_status FROM tasks WHERE id = ?").bind(task_id.as_str()).fetch_optional(db.get_pool()).await?;
  Ok(maybe_status.map(|status| TaskStatus::from_str(&status)).transpose()?)
}
