use crate::connection::TaskDbConnection;
use crate::error::SqliteTasksError;
use enums::common::generation_provider::GenerationProvider;
use enums::tauri::tasks::task_status::TaskStatus;
use enums::tauri::tasks::task_type::TaskType;
use tokens::tokens::sqlite::tasks::TaskId;

pub struct CreateTaskArgs<'a> {
  pub db: &'a TaskDbConnection,
  pub status: TaskStatus,
  pub task_type: TaskType,
  pub provider: GenerationProvider,
  pub provider_job_id: Option<&'a str>,
  pub frontend_subscriber_id: Option<&'a str>,
  pub frontend_subscriber_payload: Option<&'a str>,
}

pub async fn create_task(
  args: CreateTaskArgs<'_>,
) -> Result<TaskId, SqliteTasksError> {
  let task_id = TaskId::generate();
  
  // TODO(bt,2025-07-12): Fix this. The sqlx mysql queries never required temporaries
  let task_id_temp = task_id.as_str();
  let status_temp = args.status.to_str();
  let task_type_temp = args.task_type.to_str();
  let provider_temp = args.provider.to_string();

  let query = sqlx::query!(r#"
    INSERT INTO tasks (
      id,
      task_status,
      task_type,
      provider,
      provider_job_id,
      frontend_subscriber_id,
      frontend_subscriber_payload
    )
    VALUES (?, ?, ?, ?, ?, ?, ?)
  "#,
      task_id_temp,
      status_temp,
      task_type_temp,
      provider_temp,
      args.provider_job_id,
      args.frontend_subscriber_id,
      args.frontend_subscriber_payload
  );

  let _r = query.execute(args.db.get_pool()).await?;
  
  Ok(task_id)
}
