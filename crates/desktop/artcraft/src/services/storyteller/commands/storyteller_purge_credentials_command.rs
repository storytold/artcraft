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
use tauri::{AppHandle, Manager, State};
use crate::core::threads::main_window_thread::persist_storyteller_cookies_task::storyteller_cookie_url;
use crate::services::storyteller::state::purge_http_credentials::purge_http_credentials;
use tauri_plugin_http::Http;

#[derive(Serialize)]
pub struct PurgeStorytellerCredentialsCommandResponse {
  pub success: bool,
}

impl SerializeMarker for PurgeStorytellerCredentialsCommandResponse {}

#[tauri::command]
pub async fn storyteller_purge_credentials_command(
  app: AppHandle,
  storyteller_creds_manager: State<'_, StorytellerCredentialManager>,
) -> ResponseOrErrorMessage<PurgeStorytellerCredentialsCommandResponse> {
  info!("storyteller_purge_credentials_command called");

  reset(&app, &storyteller_creds_manager)
      .await
      .map_err(|err| {
        error!("Error purging credentials: {:?}", err);
        format!("Error purging credentials: {:?}", err)
      })?;

  Ok(PurgeStorytellerCredentialsCommandResponse {
    success: true,
  }.into())
}

async fn reset(
  app: &AppHandle,
  storyteller_creds_manager: &StorytellerCredentialManager
) -> AnyhowResult<()> {

  let http = app.try_state::<Http>().ok_or_else(|| anyhow!("HTTP plugin unavailable"))?;
  purge_http_credentials(&http.cookies_jar, storyteller_creds_manager, &storyteller_cookie_url(app)?).await?;
  clear_main_webview_window_storyteller_cookies(app)?;
  Ok(())
}
