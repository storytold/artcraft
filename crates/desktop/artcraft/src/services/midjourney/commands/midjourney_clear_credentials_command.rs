use crate::core::commands::response::shorthand::SimpleResponse;
use crate::services::midjourney::state::midjourney_credential_manager::MidjourneyCredentialManager;
use log::{error, info};
use tauri::State;

#[tauri::command]
pub async fn midjourney_clear_credentials_command(creds_manager: State<'_, MidjourneyCredentialManager>) -> SimpleResponse {
  info!("midjourney_clear_credentials_command called");

  creds_manager.clear_credentials().await.map_err(|err| {
    error!("Error clearing creds: {:?}", err);
    "error clearing creds"
  })?;

  Ok(().into())
}
