use crate::core::commands::deprecated::image_edit::enqueue_edit_image_command::EnqueueEditImageSuccessResponse;
use crate::core::commands::response::shorthand::ResponseOrErrorMessage;
use crate::core::commands::response::success_response_wrapper::SerializeMarker;
use crate::core::state::app_preferences::app_preferences_manager::AppPreferencesManager;
use crate::core::state::app_preferences::preferred_download_directory::PreferredDownloadDirectory;
use crate::core::state::data_dir::app_data_root::AppDataRoot;
use crate::services::storyteller::state::storyteller_credential_manager::StorytellerCredentialManager;
use crate::services::storyteller::windows::clear_main_webview_window_storyteller_cookies::clear_main_webview_window_storyteller_cookies;
use anyhow::anyhow;
use errors::AnyhowResult;
use log::{error, info};
use serde_derive::{Deserialize, Serialize};
use tauri::{AppHandle, State};

#[derive(Serialize)]
pub struct ResetArtcraftCommandResponse {
  pub success: bool,
}

impl SerializeMarker for ResetArtcraftCommandResponse {}

#[tauri::command]
pub async fn reset_artcraft_command(
  app: AppHandle,
) -> ResponseOrErrorMessage<ResetArtcraftCommandResponse> {
  info!("reset_artcraft_command called");

  // TODO: Reset local vs. production

  Ok(ResetArtcraftCommandResponse {
    success: true,
  }.into())
}

