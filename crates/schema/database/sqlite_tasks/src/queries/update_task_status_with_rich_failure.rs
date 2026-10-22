use enums::tauri::tasks::task_failure_type::TaskFailureType;
use crate::connection::TaskDbConnection;
use crate::error::SqliteTasksError;
use enums::tauri::tasks::task_status::TaskStatus;
use tokens::tokens::sqlite::tasks::TaskId;

/// The failure message column holds at most this many bytes of the message.
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
      .map(trim_failure_message);

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

/// Cut the message down to the column limit.
fn trim_failure_message(message: &str) -> &str {
  if message.len() <= MAX_FAILURE_MESSAGE_BYTES {
    return message;
  }
  // FIX: slicing at byte 255 panics when that byte is inside a multi-byte
  // character (curly quotes, accents, CJK in a provider's error text), which
  // killed the polling thread before the task was marked failed. Step back to
  // the nearest character boundary instead.
  let mut end = MAX_FAILURE_MESSAGE_BYTES;
  while !message.is_char_boundary(end) {
    end -= 1;
  }
  &message[..end]
}

#[cfg(test)]
mod tests {
  use super::*;

  #[test]
  fn short_message_is_unchanged() {
    assert_eq!(trim_failure_message("prompt was flagged"), "prompt was flagged");
  }

  #[test]
  fn long_ascii_message_is_cut_at_the_limit() {
    let message = "a".repeat(300);
    assert_eq!(trim_failure_message(&message).len(), MAX_FAILURE_MESSAGE_BYTES);
  }

  #[test]
  fn cut_inside_a_multibyte_character_does_not_panic() {
    // 128 two-byte characters: 256 bytes, so byte 255 is in the middle of the last one.
    let message = "é".repeat(128);
    assert_eq!(message.len(), 256);
    let trimmed = trim_failure_message(&message);
    assert!(trimmed.len() <= MAX_FAILURE_MESSAGE_BYTES);
    assert!(message.starts_with(trimmed));
  }

  // NB: A plain #[test] with a hand-built runtime, because this crate forbids `unused_mut`, which the
  // #[tokio::test] expansion trips over.
  #[test]
  fn failure_type_and_message_are_stored_and_the_task_is_stamped_complete() {
    use crate::connection::TaskDbConnection;
    use crate::queries::create_task::{create_task, CreateTaskArgs};
    use enums::common::generation_provider::GenerationProvider;
    use enums::tauri::tasks::task_type::TaskType;

    let runtime = tokio::runtime::Builder::new_current_thread().enable_all().build().unwrap();
    runtime.block_on(async {
      let dir = tempfile::tempdir().unwrap();
      let db = TaskDbConnection::connect_and_migrate(dir.path().join("tasks.sqlite")).await.unwrap();
      let task_id = create_task(CreateTaskArgs {
        db: &db,
        status: TaskStatus::Pending,
        task_type: TaskType::ImageGeneration,
        model_type: None,
        provider: GenerationProvider::Fal,
        provider_job_id: Some("job-1"),
        queue_status_url: None,
        queue_response_url: None,
        prompt_token: None,
        frontend_caller: None,
        frontend_subscriber_id: None,
        frontend_subscriber_payload: None,
      }).await.unwrap();

      update_task_status_with_rich_failure(UpdateTaskWithRichFailureArgs {
        db: &db,
        task_id: &task_id,
        status: TaskStatus::CompleteFailure,
        maybe_failure_type: Some(TaskFailureType::GenerationFailed),
        maybe_failure_message: Some("fal job failed (422)"),
      }).await.unwrap();

      let row = sqlx::query_as::<_, (String, Option<String>, Option<String>, Option<i64>)>(
        "SELECT task_status, on_failure_type, on_failure_message, completed_at FROM tasks WHERE id = ?",
      )
          .bind(task_id.as_str())
          .fetch_one(db.get_pool())
          .await
          .unwrap();
      assert_eq!(row.0, "complete_failure");
      assert_eq!(row.1.as_deref(), Some(TaskFailureType::GenerationFailed.to_str()));
      assert_eq!(row.2.as_deref(), Some("fal job failed (422)"));
      assert!(row.3.is_some());
    });
  }
}
