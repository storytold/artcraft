use enums::tauri::tasks::task_failure_type::TaskFailureType;
use crate::connection::TaskDbConnection;
use crate::error::SqliteTasksError;
use enums::tauri::tasks::task_status::TaskStatus;
use tokens::tokens::sqlite::tasks::TaskId;

/// Maximum length, in bytes, of the stored failure message.
const MAX_FAILURE_MESSAGE_BYTES: usize = 255;

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
      .map(truncate_failure_message);

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

/// Truncate to at most `MAX_FAILURE_MESSAGE_BYTES` without splitting a UTF-8 character.
/// NB: Slicing at a fixed byte offset panics when it lands inside a multi-byte character.
fn truncate_failure_message(message: &str) -> &str {
  &message[..message.floor_char_boundary(MAX_FAILURE_MESSAGE_BYTES)]
}

#[cfg(test)]
mod tests {
  use super::*;

  #[test]
  fn short_messages_are_unchanged() {
    assert_eq!(truncate_failure_message("Prompt was flagged"), "Prompt was flagged");
  }

  #[test]
  fn long_ascii_messages_are_cut_at_the_limit() {
    let message = "a".repeat(300);
    assert_eq!(truncate_failure_message(&message).len(), MAX_FAILURE_MESSAGE_BYTES);
  }

  #[test]
  fn multi_byte_character_on_the_limit_is_not_split() {
    // 254 ASCII bytes, then a 3-byte character straddling byte 255.
    let message = format!("{}{}", "a".repeat(254), "€€");
    let truncated = truncate_failure_message(&message);
    assert_eq!(truncated, "a".repeat(254));
  }
}
