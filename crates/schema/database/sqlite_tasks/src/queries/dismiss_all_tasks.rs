use crate::connection::TaskDbConnection;
use crate::error::SqliteTasksError;

/// Mark everything as dismissed.
pub async fn dismiss_all_tasks(
  db: &TaskDbConnection,
) -> Result<bool, SqliteTasksError> {

  let query = sqlx::query!(r#"
    UPDATE tasks
    SET is_dismissed_by_user = 1
    WHERE is_dismissed_by_user != 1
  "#);

  let res = query.execute(db.get_pool()).await?;
  let rows_updated = res.rows_affected() > 0;

  Ok(rows_updated)
}
