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
use enums::tauri::tasks::task_failure_type::TaskFailureType;
use sqlite_tasks::queries::update_task_status_with_rich_failure::{update_task_status_with_rich_failure, UpdateTaskWithRichFailureArgs};

pub async fn handle_failed_job(
  app_handle: &AppHandle,
  job: &ListSessionJobsItem,
  task: &Task,
  task_database: &TaskDatabase,
) -> AnyhowResult<()> {
  info!("Marking storyteller job as failed: {:?}", task.id);

  let maybe_failure_type = job.status
      .maybe_failure_category_updated
      .as_ref()
      .map(|val| TaskFailureType::from_frontend_failure_category_for_api(val));
  
  let maybe_failure_message = job.status.maybe_failure_message.as_deref();

  update_task_status_with_rich_failure(UpdateTaskWithRichFailureArgs {
    db: task_database.get_connection(),
    task_id: &task.id,
    status: TaskStatus::CompleteFailure,
    maybe_failure_type,
    maybe_failure_message,
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
