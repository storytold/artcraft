use crate::core::commands::response::shorthand::ResponseOrErrorMessage;
use crate::core::commands::response::success_response_wrapper::SerializeMarker;
use crate::core::events::basic_sendable_event_trait::BasicSendableEvent;
use crate::core::events::functional_events::media_file_deleted_event::MediaFileDeletedEvent;
use crate::core::events::generation_events::generation_enqueue_success_event::GenerationEnqueueSuccessEvent;
use crate::core::state::app_env_configs::app_env_configs::AppEnvConfigs;
use crate::core::state::data_dir::app_data_root::AppDataRoot;
use crate::core::state::provider_priority::{Provider, ProviderPriorityStore};
use crate::core::state::task_database::TaskDatabase;
use crate::services::sora::state::sora_task_queue::SoraTaskQueue;
use crate::services::storyteller::state::storyteller_credential_manager::StorytellerCredentialManager;
use errors::AnyhowResult;
use log::{error, info, warn};
use serde_derive::{Deserialize, Serialize};
use artcraft_client::endpoints::media_files::delete_media_file::delete_media_file;
use tauri::{AppHandle, State};
use tokens::tokens::media_files::MediaFileToken;

#[derive(Deserialize)]
pub struct MediaFileDeleteRequest {
  /// REQUIRED.
  /// Media file to delete. The user must own the file.
  pub media_file_token: MediaFileToken,
}

#[derive(Serialize)]
pub struct MediaFileDeleteSuccessResponse {
  pub success: bool,
}

impl SerializeMarker for MediaFileDeleteSuccessResponse {}

#[tauri::command]
pub async fn media_file_delete_command(
  app: AppHandle,
  request: MediaFileDeleteRequest,
  app_env_configs: State<'_, AppEnvConfigs>,
  storyteller_creds_manager: State<'_, StorytellerCredentialManager>,
) -> ResponseOrErrorMessage<MediaFileDeleteSuccessResponse> {

  info!("media_file_delete_command called");

  let result = handle_request(
    request,
    &app,
    &app_env_configs,
    &storyteller_creds_manager,
  ).await;

  if let Err(err) = result {
    error!("media_file_delete_command failed: {:?}", err);
    return Err("delete failed".into())
  }

  Ok(MediaFileDeleteSuccessResponse {
    success: true,
  }.into())
}

pub async fn handle_request(
  request: MediaFileDeleteRequest,
  app: &AppHandle,
  app_env_configs: &AppEnvConfigs,
  storyteller_creds_manager: &StorytellerCredentialManager,
) -> AnyhowResult<()> {

  let creds = storyteller_creds_manager.get_credentials()?;

  let _result = delete_media_file(
    &app_env_configs.storyteller_host,
    creds.as_ref(),
    &request.media_file_token
  ).await?;

  MediaFileDeletedEvent {
    media_file_token: request.media_file_token,
  }.send_infallible(app);

  Ok(())
}
