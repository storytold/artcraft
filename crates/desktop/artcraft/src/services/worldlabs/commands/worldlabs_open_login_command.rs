use crate::core::state::data_dir::app_data_root::AppDataRoot;
use crate::services::worldlabs::state::worldlabs_bearer_bridge::WorldlabsBearerBridge;
use crate::services::worldlabs::state::worldlabs_credential_manager::WorldlabsCredentialManager;
use crate::services::worldlabs::windows::worldlabs_login_window::worldlabs_login_window_open::worldlabs_login_window_open;
use errors::AnyhowResult;
use log::{error, info};
use tauri::{AppHandle, State};

#[tauri::command]
pub async fn worldlabs_open_login_command(
  app: AppHandle,
  app_data_root: State<'_, AppDataRoot>,
  worldlabs_bearer_bridge: State<'_, WorldlabsBearerBridge>,
  worldlabs_creds_manager: State<'_, WorldlabsCredentialManager>,
) -> Result<String, String> {
  info!("worldlabs_open_login_command called");

  do_open_login(&app, &app_data_root, &worldlabs_bearer_bridge, &worldlabs_creds_manager)
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
  worldlabs_bearer_bridge: &WorldlabsBearerBridge,
  worldlabs_creds_manager: &WorldlabsCredentialManager,
) -> AnyhowResult<()> {
  info!("Building login window...");

  worldlabs_login_window_open(
    app,
    app_data_root,
    worldlabs_bearer_bridge,
    worldlabs_creds_manager
  ).await?;

  info!("Done.");
  Ok(())
}
