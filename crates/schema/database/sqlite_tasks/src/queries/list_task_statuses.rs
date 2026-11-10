use crate::connection::TaskDbConnection;
use crate::error::SqliteTasksError;

pub async fn list_task_statuses(db: &TaskDbConnection) -> Result<Vec<(String, String)>, SqliteTasksError> {
  Ok(sqlx::query_as::<_, (String, String)>("SELECT id, task_status FROM tasks").fetch_all(db.get_pool()).await?)
}
