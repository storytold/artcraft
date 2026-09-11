use enums::common::generation_provider::GenerationProvider;
use enums::tauri::tasks::task_model_type::TaskModelType;
use enums::tauri::tasks::task_status::TaskStatus;
use enums::tauri::tasks::task_type::TaskType;
use enums::tauri::ux::tauri_command_caller::TauriCommandCaller;
use tokens::tokens::sqlite::tasks::TaskId;

#[derive(Debug, Clone)]
pub struct Task {
  pub id: TaskId,
  pub status: TaskStatus,
  pub task_type: TaskType,
  pub model_type: Option<TaskModelType>,
  pub provider: GenerationProvider,
  pub provider_job_id: Option<String>,
  pub queue_status_url: Option<String>,
  pub queue_response_url: Option<String>,
  pub prompt_token: Option<String>,
  pub frontend_caller: Option<TauriCommandCaller>,
  pub frontend_subscriber_id: Option<String>,
  pub frontend_subscriber_payload: Option<String>,
}

#[derive(Debug)]
#[derive(sqlx::FromRow)]
pub (crate) struct RawTask {
  pub (crate) id: String,
  pub (crate) task_status: String,
  pub (crate) task_type: String,
  pub (crate) model_type: Option<String>,
  pub (crate) provider: String,
  pub (crate) provider_job_id: Option<String>,
  pub (crate) queue_status_url: Option<String>,
  pub (crate) queue_response_url: Option<String>,
  pub (crate) prompt_token: Option<String>,
  pub (crate) frontend_caller: Option<String>,
  pub (crate) frontend_subscriber_id: Option<String>,
  pub (crate) frontend_subscriber_payload: Option<String>,
}
