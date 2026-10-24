use crate::core::events::basic_sendable_event_trait::BasicSendableEvent;
use crate::core::events::generation_events::common::GenerationServiceProvider;
use crate::core::events::generation_events::generation_failed_event::GenerationFailedEvent;
use crate::core::state::app_env_configs::app_env_configs::AppEnvConfigs;
use crate::core::state::data_dir::app_data_root::AppDataRoot;
use crate::core::state::task_database::TaskDatabase;
use crate::services::sora::state::sora_task_queue::SoraTaskQueue;
use crate::services::sora::threads::sora_task_polling::helpers::handle_successful_generations::GenerationItem;
use enums::tauri::tasks::task_status;
use errors::AnyhowResult;
use log::info;
use openai_sora_client::requests::common::task_id::TaskId;
use openai_sora_client::requests::list_classic_tasks::list_classic_tasks::PartialTaskResponse;
use sqlite_tasks::queries::task::Task;
use crate::core::utils::enum_conversion::task_type::to_generation_action;
use enums::tauri::tasks::task_failure_type::TaskFailureType;
use sqlite_tasks::queries::update_task_status_with_rich_failure::{update_task_status_with_rich_failure, UpdateTaskWithRichFailureArgs};
use std::collections::HashMap;
use artcraft_client::credentials::storyteller_credential_set::StorytellerCredentialSet;
use tauri::AppHandle;

pub struct FailedGeneration {
  pub reason: Option<String>,
}

pub async fn handle_classic_failed_generations(
  app_handle: &AppHandle,
  task_database: &TaskDatabase,
  local_sqlite_tasks_by_sora_task_id: &HashMap<String, Task>,
  sora_failed_tasks_by_id: &HashMap<TaskId, FailedGeneration>,
  sora_task_queue: &SoraTaskQueue,
) -> AnyhowResult<()> {

  for (task_id, task) in sora_failed_tasks_by_id.iter() {
    // Tasks we did not start (or already finished) have no local row, so there is nothing to report or update.
    let Some(local_task) = local_sqlite_tasks_by_sora_task_id.get(task_id.as_str()) else {
      continue;
    };

    // Emit events for failed tasks.
    // FIX: the action was always GenerateImage, but Sora 2 drafts go through this handler too and those are videos;
    // take it from the task so the failure is reported as the right kind of generation.
    let event = GenerationFailedEvent {
      action: to_generation_action(local_task.task_type),
      service: GenerationServiceProvider::Sora,
      model: None,
      reason: task.reason.clone(),
    };

    event.send_infallible(&app_handle);

    // Mark the local task failed, and keep the reason on it so the task queue (rebuilt from SQLite) can show why.
    info!("Marking local task as failed: {:?}", local_task.id);

    let _updated = update_task_status_with_rich_failure(UpdateTaskWithRichFailureArgs {
      db: task_database.get_connection(),
      task_id: &local_task.id,
      status: task_status::TaskStatus::CompleteFailure,
      maybe_failure_type: Some(TaskFailureType::GenerationFailed),
      maybe_failure_message: task.reason.as_deref(),
    }).await?;
  }

  // Clear from in memory DB
  // TODO: Remove the in-memory queue in favor of SQLite only.
  let failed_task_ids: Vec<&TaskId> = sora_failed_tasks_by_id.keys().collect();
  sora_task_queue.remove_list(&failed_task_ids)?;

  Ok(())
}
