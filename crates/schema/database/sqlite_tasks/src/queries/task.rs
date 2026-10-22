use crate::error::SqliteTasksError;
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

impl RawTask {
  /// Parses the stored strings into a `Task`. Fails when a value is one this build does not know (for example a
  /// `task_type` left by a newer version of the app), so callers listing many tasks should skip the row and go on.
  pub (crate) fn into_task(self) -> Result<Task, SqliteTasksError> {
    Ok(Task {
      id: TaskId::new_from_str(&self.id),
      status: TaskStatus::from_str(&self.task_status)?,
      task_type: TaskType::from_str(&self.task_type)?,
      model_type: self.model_type
          .map(|model| TaskModelType::from_str(&model))
          .transpose()?,
      provider: GenerationProvider::from_str(&self.provider)?,
      provider_job_id: self.provider_job_id,
      queue_status_url: self.queue_status_url,
      queue_response_url: self.queue_response_url,
      prompt_token: self.prompt_token,
      frontend_caller: self.frontend_caller
          .map(|caller| TauriCommandCaller::from_str(&caller))
          .transpose()?,
      frontend_subscriber_id: self.frontend_subscriber_id,
      frontend_subscriber_payload: self.frontend_subscriber_payload,
    })
  }
}

#[cfg(test)]
mod tests {
  use super::*;

  #[test]
  fn a_known_row_converts() {
    let task = raw("pending", "image_generation").into_task().unwrap();
    assert_eq!(task.status, TaskStatus::Pending);
    assert_eq!(task.task_type, TaskType::ImageGeneration);
  }

  #[test]
  fn an_unknown_task_type_is_an_error() {
    assert!(raw("pending", "from_a_newer_version").into_task().is_err());
  }

  #[test]
  fn an_unknown_status_is_an_error() {
    assert!(raw("from_a_newer_version", "image_generation").into_task().is_err());
  }

  fn raw(task_status: &str, task_type: &str) -> RawTask {
    RawTask {
      id: "task_1".to_string(),
      task_status: task_status.to_string(),
      task_type: task_type.to_string(),
      model_type: None,
      provider: GenerationProvider::Fal.to_string(),
      provider_job_id: None,
      queue_status_url: None,
      queue_response_url: None,
      prompt_token: None,
      frontend_caller: None,
      frontend_subscriber_id: None,
      frontend_subscriber_payload: None,
    }
  }
}
