use crate::core::events::basic_sendable_event_trait::BasicSendableEvent;
use crate::core::events::generation_events::common::{GenerationAction, GenerationServiceProvider};
use crate::core::events::generation_events::generation_failed_event::GenerationFailedEvent;
use crate::core::state::task_database::TaskDatabase;
use enums::tauri::tasks::task_status::TaskStatus;
use enums::tauri::tasks::task_type::TaskType;
use log::{error, info};
use sqlite_tasks::queries::task::Task;
use enums::tauri::tasks::task_failure_type::TaskFailureType;
use sqlite_tasks::queries::update_task_status_with_rich_failure::{update_task_status_with_rich_failure, UpdateTaskWithRichFailureArgs};
use tauri::AppHandle;

pub async fn handle_fal_failure(
  app_handle: &AppHandle,
  task_database: &TaskDatabase,
  task: &Task,
  reason: &str,
) {
  info!("[FalPolling] Marking task {} as failed: {}", task.id.as_str(), reason);

  // Store the reason with the task so the task queue (rebuilt from SQLite on every poll) can show it, not just
  // the one-time event below.
  let update_result = update_task_status_with_rich_failure(UpdateTaskWithRichFailureArgs {
    db: task_database.get_connection(),
    task_id: &task.id,
    status: TaskStatus::CompleteFailure,
    maybe_failure_type: Some(TaskFailureType::GenerationFailed),
    maybe_failure_message: Some(reason),
  }).await;

  if let Err(err) = update_result {
    error!("[FalPolling] Failed to update task status for {}: {:?}", task.id.as_str(), err);
  }

  let action = task_type_to_generation_action(task.task_type);

  let event = GenerationFailedEvent {
    action,
    service: GenerationServiceProvider::Fal,
    model: None,
    reason: Some(reason.to_string()),
  };

  event.send_infallible(app_handle);
}

fn task_type_to_generation_action(task_type: TaskType) -> GenerationAction {
  match task_type {
    TaskType::ImageGeneration => GenerationAction::GenerateImage,
    TaskType::VideoGeneration => GenerationAction::GenerateVideo,
    TaskType::AudioGeneration => GenerationAction::GenerateAudio,
    TaskType::BackgroundRemoval => GenerationAction::RemoveBackground,
    TaskType::ObjectGeneration => GenerationAction::ImageTo3d,
    TaskType::GaussianGeneration => GenerationAction::GenerateGaussian,
    TaskType::ImageInpaintEdit => GenerationAction::ImageInpaintEdit,
  }
}
