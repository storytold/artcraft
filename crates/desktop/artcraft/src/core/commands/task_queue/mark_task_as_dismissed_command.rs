use crate::core::commands::response::shorthand::ResponseOrErrorMessage;
use crate::core::commands::response::success_response_wrapper::SerializeMarker;
use crate::core::events::generation_events::generation_enqueue_success_event::GenerationEnqueueSuccessEvent;
use crate::core::state::app_env_configs::app_env_configs::AppEnvConfigs;
use crate::core::state::data_dir::app_data_root::AppDataRoot;
use crate::core::state::provider_priority::{Provider, ProviderPriorityStore};
use crate::core::state::task_database::TaskDatabase;
use crate::services::sora::state::sora_task_queue::SoraTaskQueue;
use crate::services::storyteller::state::storyteller_credential_manager::StorytellerCredentialManager;
use chrono::{DateTime, Utc};
use errors::AnyhowResult;
use log::{error, info, warn};
use serde_derive::{Deserialize, Serialize};
use sqlite_tasks::queries::list_tasks_for_frontend::list_tasks_for_frontend;
use sqlite_tasks::queries::mark_task_as_dismissed::mark_task_as_dismissed;
use artcraft_client::endpoints::media_files::delete_media_file::delete_media_file;
use tauri::{AppHandle, State};
use tokens::tokens::media_files::MediaFileToken;
use tokens::tokens::sqlite::tasks::TaskId;

#[derive(Deserialize)]
pub struct MarkTaskAsDismissedRequest {
  task: TaskId,
}

#[derive(Serialize)]
pub struct MarkTaskAsDismissedResponse {
  success: bool,
}

impl SerializeMarker for MarkTaskAsDismissedResponse {}

#[tauri::command]
pub async fn mark_task_as_dismissed_command(
  request: MarkTaskAsDismissedRequest,
  app: AppHandle,
  app_env_configs: State<'_, AppEnvConfigs>,
  task_database: State<'_, TaskDatabase>,
) -> ResponseOrErrorMessage<MarkTaskAsDismissedResponse> {

  info!("mark_task_as_dismissed_command called");

  let result = handle_request(
    &request.task,
    &task_database,
  ).await;

  if let Err(err) = &result {
    error!("mark_task_as_dismissed_command failed: {:?}", err);
    return Err("mark_task_as_dismissed_command failed".into())
  }

  Ok(MarkTaskAsDismissedResponse{
    success: true,
  }.into())
}

pub async fn handle_request(
  task_id: &TaskId,
  task_database: &TaskDatabase,
) -> AnyhowResult<()> {
  let _result = mark_task_as_dismissed(task_database.get_connection(), task_id).await?;
  Ok(())
}
