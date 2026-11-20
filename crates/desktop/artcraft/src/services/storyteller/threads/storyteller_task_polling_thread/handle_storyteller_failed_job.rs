use crate::core::events::generation_events::common::GenerationModel;
use crate::core::events::basic_sendable_event_trait::BasicSendableEvent;
use crate::core::events::generation_events::generation_failed_event::GenerationFailedEvent;
use crate::core::state::app_env_configs::app_env_configs::AppEnvConfigs;
use crate::core::state::task_database::TaskDatabase;
use crate::core::utils::enum_conversion::generation_provider::to_generation_service_provider;
use crate::core::utils::enum_conversion::task_type::to_generation_action;
use super::sora_latency_client_log::maybe_log_sora_client_completion;
use artcraft_api_defs::jobs::list_session_jobs::ListSessionJobsItem;
use artcraft_client::credentials::storyteller_credential_set::StorytellerCredentialSet;
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
  app_env_configs: &AppEnvConfigs,
  maybe_creds: Option<&StorytellerCredentialSet>,
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

  maybe_log_sora_client_completion(app_env_configs, maybe_creds, job, task, "failure").await;

  let service = to_generation_service_provider(task.provider);
  let action = to_generation_action(task.task_type);

  let event = GenerationFailedEvent {
    action,
    service,
    model: task.model_type.as_ref().map(|model| GenerationModel::Unknown(model.to_str().to_owned())),
    reason: None,
  };

  event.send_infallible(app_handle);

  Ok(())
}
