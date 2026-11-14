use crate::core::events::basic_sendable_event_trait::BasicSendableEvent;
use crate::core::events::generation_events::common::GenerationAction;
use crate::core::events::generation_events::generation_failed_event::GenerationFailedEvent;
use crate::core::state::task_database::TaskDatabase;
use enums::tauri::tasks::task_status::TaskStatus;
use enums::tauri::tasks::task_type::TaskType;
use log::{error, info};
use sqlite_tasks::queries::task::Task;
use sqlite_tasks::queries::update_task_status::{update_task_status, UpdateTaskArgs};
use tauri::AppHandle;
use crate::core::utils::enum_conversion::generation_provider::to_generation_service_provider;

/// Persist terminal failure before emitting its event, and never overwrite an already-terminal task.
pub async fn handle_provider_failure(app_handle: &AppHandle<impl tauri::Runtime>, task_database: &TaskDatabase, task: &Task, reason: &str) -> bool {
  info!("[ProviderPolling] Marking task {} as failed: {}", task.id.as_str(), reason);

  let update_result = update_task_status(UpdateTaskArgs { db: task_database.get_connection(), task_id: &task.id, status: TaskStatus::CompleteFailure }).await;

  match update_result {
    Ok(true) => {},
    Ok(false) => return false,
    Err(err) => {
      error!("[ProviderPolling] Failed to update task status for {}: {:?}", task.id.as_str(), err);
      return false;
    },
  }

  let action = task_type_to_generation_action(task.task_type);

  let event = GenerationFailedEvent { action, service: to_generation_service_provider(task.provider), model: None, reason: Some(reason.to_string()) };

  event.send_infallible(app_handle);
  true
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
