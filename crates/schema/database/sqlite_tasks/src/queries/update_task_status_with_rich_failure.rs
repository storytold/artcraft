use enums::tauri::tasks::task_failure_type::TaskFailureType;
use crate::connection::TaskDbConnection;
use crate::error::SqliteTasksError;
use enums::tauri::tasks::task_status::TaskStatus;
use tokens::tokens::sqlite::tasks::TaskId;

pub struct UpdateTaskWithRichFailureArgs<'a> {
  pub db: &'a TaskDbConnection,
  pub task_id: &'a TaskId,
  pub status: TaskStatus,
  pub maybe_failure_type: Option<TaskFailureType>,
  pub maybe_failure_message: Option<&'a str>,
}

/// Returns true if rows were updated.
pub async fn update_task_status_with_rich_failure(
  args: UpdateTaskWithRichFailureArgs<'_>,
) -> Result<bool, SqliteTasksError> {

  // TODO(bt,2025-07-12): Fix this. The sqlx mysql queries never required temporaries
  let task_id_temp = args.task_id.as_str();
  let status_temp = args.status.to_str();
  let maybe_failure_type_temp = args.maybe_failure_type.map(|val| val.to_str());

  // Trim the message so it doesn't overflow the database column
  let maybe_failure_message_temp = args.maybe_failure_message
      .map(|s| if s.len() > 255 { &s[..255] } else { s });

  // info!("Update task id: {}, status: {}", task_id_temp, status_temp);

  // TODO(bt,2025-07-15): We can't set a LIMIT without a certain compiler flag for SQLite ?
  let query = sqlx::query!(r#"
    UPDATE tasks
    SET task_status = ?,
    on_failure_type = ?,
    on_failure_message = ?
    WHERE id = ?
  "#,
      status_temp,
      maybe_failure_type_temp,
      maybe_failure_message_temp,
      task_id_temp,
  );

  // info!("query: {:?}", query.sql());

  let res = query.execute(args.db.get_pool()).await?;
  let rows_updated = res.rows_affected() > 0;

  Ok(rows_updated)
}
