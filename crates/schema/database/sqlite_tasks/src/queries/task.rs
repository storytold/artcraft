use enums_db::common::generation::generation_provider::GenerationProvider;
use enums_db::tauri::tasks::task_model_type::TaskModelType;
use enums_db::tauri::tasks::task_status::TaskStatus;
use enums_db::tauri::tasks::task_type::TaskType;
use enums_db::tauri::ux::tauri_command_caller::TauriCommandCaller;
use tokens::tokens::sqlite::tasks::TaskId;

#[derive(Debug, Clone)]
pub struct Task {
  pub id: TaskId,
  pub status: TaskStatus,
  pub task_type: TaskType,
  pub model_type: Option<TaskModelType>,
  pub provider: GenerationProvider,
  pub provider_job_id: Option<String>,
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
  pub (crate) frontend_caller: Option<String>,
  pub (crate) frontend_subscriber_id: Option<String>,
  pub (crate) frontend_subscriber_payload: Option<String>,
}
