use crate::error::SqliteTasksError;
use crate::queries::create_task::CreateTaskArgs;
use tokens::tokens::sqlite::tasks::TaskId;

pub async fn create_task_once(args: CreateTaskArgs<'_>) -> Result<TaskId, SqliteTasksError> {
  let job_id = args.provider_job_id.filter(|value| !value.is_empty()).ok_or_else(|| sqlx::Error::Protocol("A stable provider job ID is required for task recovery".into()))?;
  let task_id = TaskId::generate();
  sqlx::query(
    r#"
    INSERT INTO tasks (id, task_status, task_type, model_type, provider, provider_job_id,
      queue_status_url, queue_response_url, prompt_token, frontend_caller,
      frontend_subscriber_id, frontend_subscriber_payload)
    SELECT ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?
    WHERE NOT EXISTS (SELECT 1 FROM tasks WHERE provider = ? AND provider_job_id = ?)
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
  .execute(args.db.get_pool())
  .await?;
  let stored: String = sqlx::query_scalar("SELECT id FROM tasks WHERE provider = ? AND provider_job_id = ? ORDER BY rowid LIMIT 1").bind(args.provider.to_str()).bind(job_id).fetch_one(args.db.get_pool()).await?;
  Ok(TaskId::new_from_str(&stored))
}
