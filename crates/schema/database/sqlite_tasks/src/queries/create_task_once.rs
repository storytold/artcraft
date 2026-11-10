use crate::error::SqliteTasksError;
use crate::queries::create_task::CreateTaskArgs;
use tokens::tokens::sqlite::tasks::TaskId;

pub async fn create_task_once(args: CreateTaskArgs<'_>) -> Result<TaskId, SqliteTasksError> {
  let job_id = args.provider_job_id.filter(|value| !value.is_empty()).ok_or_else(|| sqlx::Error::Protocol("A stable provider job ID is required for task recovery".into()))?;
  let task_id = TaskId::generate();
  let inserted: Vec<String> = sqlx::query_scalar(
    r#"
    INSERT INTO tasks (id, task_status, task_type, model_type, provider, provider_job_id,
      queue_status_url, queue_response_url, prompt_token, frontend_caller,
      frontend_subscriber_id, frontend_subscriber_payload)
    SELECT ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?
    WHERE NOT EXISTS (SELECT 1 FROM tasks WHERE provider = ? AND provider_job_id = ?)
    ON CONFLICT DO NOTHING
    RETURNING id
  "#,
  )
  .bind(task_id.as_str())
  .bind(args.status.to_str())
  .bind(args.task_type.to_str())
  .bind(args.model_type.as_ref().map(|model| model.to_str()))
  .bind(args.provider.to_str())
  .bind(job_id)
  .bind(args.queue_status_url)
  .bind(args.queue_response_url)
  .bind(args.prompt_token.map(|token| token.as_str()))
  .bind(args.frontend_caller.map(|caller| caller.to_str()))
  .bind(args.frontend_subscriber_id)
  .bind(args.frontend_subscriber_payload)
  .bind(args.provider.to_str())
  .bind(job_id)
  .fetch_all(args.db.get_pool())
  .await?;
  if let Some(stored) = inserted.into_iter().next() {
    return Ok(TaskId::new_from_str(&stored));
  }
  let stored: String = sqlx::query_scalar("SELECT id FROM tasks WHERE provider = ? AND provider_job_id = ? ORDER BY rowid LIMIT 1").bind(args.provider.to_str()).bind(job_id).fetch_one(args.db.get_pool()).await?;
  Ok(TaskId::new_from_str(&stored))
}

#[cfg(test)]
mod tests {
  use super::*;
  use crate::connection::TaskDbConnection;
  use enums::common::generation_provider::GenerationProvider;
  use enums::tauri::tasks::{task_status::TaskStatus, task_type::TaskType};

  #[test]
  fn concurrent_recovery_has_one_identity_and_terminal_metadata_remains_immutable() {
    tokio::runtime::Runtime::new().unwrap().block_on(async {
      let directory = tempfile::tempdir().unwrap();
      let db = TaskDbConnection::connect_and_migrate(directory.path().join("tasks.sqlite")).await.unwrap();
      let first_db = db.clone();
      let second_db = db.clone();
      let first = tokio::spawn(async move { create_task_once(args(&first_db)).await });
      let second = tokio::spawn(async move { create_task_once(args(&second_db)).await });
      let first = first.await.unwrap().unwrap();
      assert_eq!(first, second.await.unwrap().unwrap());
      assert_eq!(sqlx::query_scalar::<_, i64>("SELECT COUNT(*) FROM tasks").fetch_one(db.get_pool()).await.unwrap(), 1);
      sqlx::query("UPDATE tasks SET task_status = 'complete_success' WHERE id = ?").bind(first.as_str()).execute(db.get_pool()).await.unwrap();
      let result = sqlx::query("UPDATE tasks SET on_complete_primary_media_file_token = 'mf_late' WHERE id = ?").bind(first.as_str()).execute(db.get_pool()).await.unwrap();
      assert_eq!(result.rows_affected(), 0);
      let result = sqlx::query("UPDATE tasks SET is_dismissed_by_user = 1 WHERE id = ?").bind(first.as_str()).execute(db.get_pool()).await.unwrap();
      assert_eq!(result.rows_affected(), 1);
      assert_eq!(create_task_once(args(&db)).await.unwrap(), first);
    });
  }

  fn args(db: &TaskDbConnection) -> CreateTaskArgs<'_> {
    CreateTaskArgs { db, status: TaskStatus::Pending, task_type: TaskType::ImageGeneration, model_type: None, provider: GenerationProvider::WaveSpeed, provider_job_id: Some("job_recovery"), queue_status_url: None, queue_response_url: None, prompt_token: None, frontend_caller: None, frontend_subscriber_id: None, frontend_subscriber_payload: None }
  }
}
