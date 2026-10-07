use crate::core::events::basic_sendable_event_trait::BasicSendableEvent;
use crate::core::events::generation_events::common::{GenerationModel, GenerationServiceProvider};
use crate::core::events::generation_events::generation_failed_event::GenerationFailedEvent;
use crate::core::state::task_database::TaskDatabase;
use crate::core::utils::enum_conversion::task_type::to_generation_action;
use enums::tauri::tasks::task_failure_type::TaskFailureType;
use enums::tauri::tasks::task_status::TaskStatus;
use log::{error, info};
use sqlite_tasks::queries::task::Task;
use sqlite_tasks::queries::update_task_status_with_rich_failure::{
  update_task_status_with_rich_failure, UpdateTaskWithRichFailureArgs,
};
use tauri::{AppHandle, Manager};

/// Marks a BytePlus task as failed and tells the frontend why, in words the user can act on.
pub async fn handle_byteplus_failure(
  app: &AppHandle,
  task: &Task,
  failure_type: TaskFailureType,
  user_message: &str,
) {
  info!("[BytePlusFailure] Marking task {} as failed: {}", task.id.as_str(), user_message);

  let update_result = update_task_status_with_rich_failure(UpdateTaskWithRichFailureArgs {
    db: app.state::<TaskDatabase>().get_connection(),
    task_id: &task.id,
    status: TaskStatus::CompleteFailure,
    maybe_failure_type: Some(failure_type),
    maybe_failure_message: Some(user_message),
  }).await;

  if let Err(err) = update_result {
    error!("[BytePlusFailure] Failed to update task status for {}: {:?}", task.id.as_str(), err);
  }

  GenerationFailedEvent {
    action: to_generation_action(task.task_type),
    service: GenerationServiceProvider::Byteplus,
    model: task.model_type.as_ref().map(|model| GenerationModel::Unknown(model.to_str().to_owned())),
    reason: Some(user_message.to_string()),
  }.send_infallible(app);
}
