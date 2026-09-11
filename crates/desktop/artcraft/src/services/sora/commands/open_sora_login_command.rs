use crate::core::state::data_dir::app_data_root::AppDataRoot;
use crate::services::sora::state::sora_credential_manager::SoraCredentialManager;
use crate::services::sora::windows::sora_login_window::open_sora_login_window::open_sora_login_window;
use errors::AnyhowResult;
use log::{error, info};
use tauri::{AppHandle, State};

#[tauri::command]
pub async fn open_sora_login_command(
  app: AppHandle,
  app_data_root: State<'_, AppDataRoot>,
  sora_creds_manager: State<'_, SoraCredentialManager>,
) -> Result<String, String> {
  info!("open_login_command called");

  do_open_login(&app, &app_data_root, &sora_creds_manager)
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
  sora_creds_manager: &SoraCredentialManager,
) -> AnyhowResult<()> {
  info!("Building login window...");

  open_sora_login_window(app, app_data_root, sora_creds_manager).await?;

  info!("Done.");
  Ok(())
}
