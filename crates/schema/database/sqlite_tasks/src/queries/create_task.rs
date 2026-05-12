use crate::connection::TaskDbConnection;
use crate::error::SqliteTasksError;
use enums::common::generation_provider::GenerationProvider;
use enums::tauri::tasks::task_model_type::TaskModelType;
use enums::tauri::tasks::task_status::TaskStatus;
use enums::tauri::tasks::task_type::TaskType;
use enums::tauri::ux::tauri_command_caller::TauriCommandCaller;
use tokens::tokens::prompts::PromptToken;
use tokens::tokens::sqlite::tasks::TaskId;

pub struct CreateTaskArgs<'a> {
  pub db: &'a TaskDbConnection,
  pub status: TaskStatus,
  pub task_type: TaskType,
  pub model_type: Option<TaskModelType>,
  pub provider: GenerationProvider,
  pub provider_job_id: Option<&'a str>,
  pub queue_status_url: Option<&'a str>,
  pub queue_response_url: Option<&'a str>,
  pub prompt_token: Option<&'a PromptToken>,
  pub frontend_caller: Option<TauriCommandCaller>,
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
  let model_type_temp = args.model_type.map(|s| s.to_str());
  let provider_temp = args.provider.to_string();
  let prompt_token_temp = args.prompt_token.map(|t| t.as_str());
  let frontend_caller_temp = args.frontend_caller.map(|s| s.to_str());

  let query = sqlx::query!(r#"
    INSERT INTO tasks (
      id,
      task_status,
      task_type,
      model_type,
      provider,
      provider_job_id,
      queue_status_url,
      queue_response_url,
      prompt_token,
      frontend_caller,
      frontend_subscriber_id,
      frontend_subscriber_payload
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  "#,
      task_id_temp,
      status_temp,
      task_type_temp,
      model_type_temp,
      provider_temp,
      args.provider_job_id,
      args.queue_status_url,
      args.queue_response_url,
      prompt_token_temp,
      frontend_caller_temp,
      args.frontend_subscriber_id,
      args.frontend_subscriber_payload
  );

  let _r = query.execute(args.db.get_pool()).await?;
  
  Ok(task_id)
}
