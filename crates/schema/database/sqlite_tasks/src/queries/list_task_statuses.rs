use crate::connection::TaskDbConnection;
use crate::error::SqliteTasksError;

/// Load task IDs and raw statuses in one query for provider-cache cleanup.
pub async fn list_task_statuses(db: &TaskDbConnection) -> Result<Vec<(String, String)>, SqliteTasksError> {
  Ok(sqlx::query_as::<_, (String, String)>("SELECT id, task_status FROM tasks").fetch_all(db.get_pool()).await?)
}
