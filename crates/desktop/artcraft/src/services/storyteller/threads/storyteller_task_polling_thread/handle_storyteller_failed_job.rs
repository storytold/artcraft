use crate::core::events::basic_sendable_event_trait::BasicSendableEvent;
use crate::core::events::generation_events::generation_failed_event::GenerationFailedEvent;
use crate::core::state::task_database::TaskDatabase;
use crate::core::utils::enum_conversion::generation_provider::to_generation_service_provider;
use crate::core::utils::enum_conversion::task_type::to_generation_action;
use artcraft_api_defs::jobs::list_session_jobs::ListSessionJobsItem;
use enums::tauri::tasks::task_status::TaskStatus;
use errors::AnyhowResult;
use log::info;
use sqlite_tasks::queries::task::Task;
use sqlite_tasks::queries::update_task_status::{update_task_status, UpdateTaskArgs};
use tauri::AppHandle;

pub async fn handle_failed_job(
  app_handle: &AppHandle,
  job: &ListSessionJobsItem,
  task: &Task,
  task_database: &TaskDatabase,
) -> AnyhowResult<()> {
  info!("Marking storyteller job as failed: {:?}", task.id);

  update_task_status(UpdateTaskArgs {
    db: task_database.get_connection(),
    task_id: &task.id,
    status: TaskStatus::CompleteFailure,
  }).await?;

  let service = to_generation_service_provider(task.provider);
  let action = to_generation_action(task.task_type);

  let event = GenerationFailedEvent {
    action,
    service,
    model: None,
    reason: None,
  };

  event.send_infallible(app_handle);

  Ok(())
}
