use crate::core::state::data_dir::app_data_root::AppDataRoot;
use crate::services::grok::windows::grok_login_window::grok_login_window_open::grok_login_window_open;
use crate::services::midjourney::state::midjourney_credential_manager::MidjourneyCredentialManager;
use errors::AnyhowResult;
use log::{error, info};
use tauri::{AppHandle, State};
use crate::services::grok::state::grok_credential_manager::GrokCredentialManager;

#[tauri::command]
pub async fn grok_open_login_command(
  app: AppHandle,
  app_data_root: State<'_, AppDataRoot>,
  grok_creds_manager: State<'_, GrokCredentialManager>,
) -> Result<String, String> {
  info!("grok_open_login_command called");

  do_open_login(&app, &app_data_root, &grok_creds_manager)
      .await
      .map_err(|err| {
        error!("Error opening login: {:?}", err);
        format!("Error opening login: {:?}", err)
      })?;

  Ok("result".to_string())
}

async fn do_open_login(
  app: &AppHandle,
  app_data_root: &AppDataRoot,
  grok_creds_manager: &GrokCredentialManager,
) -> AnyhowResult<()> {
  info!("Building login window...");

  grok_login_window_open(app, app_data_root, grok_creds_manager).await?;

  info!("Done.");
  Ok(())
}
