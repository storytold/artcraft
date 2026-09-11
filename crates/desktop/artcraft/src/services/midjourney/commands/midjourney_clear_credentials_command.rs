use crate::core::commands::response::shorthand::{Response, SimpleResponse};
use crate::core::state::data_dir::app_data_root::AppDataRoot;
use crate::services::midjourney::state::midjourney_credential_manager::MidjourneyCredentialManager;
use errors::AnyhowResult;
use log::{error, info};
use serde_derive::Deserialize;
use tauri::State;

#[tauri::command]
pub async fn midjourney_clear_credentials_command(
  root: State<'_, AppDataRoot>,
  creds_manager: State<'_, MidjourneyCredentialManager>,
) -> SimpleResponse {
  info!("midjourney_clear_credentials_command called");

  clear_creds(&root, &creds_manager)
      .map_err(|err| {
        error!("Error clearing creds: {:?}", err);
        "error clearing creds"
      })?;

  Ok(().into())
}

fn clear_creds(
  root: &AppDataRoot,
  creds: &MidjourneyCredentialManager,
) -> AnyhowResult<()> {

  creds.clear_credentials()?;
  creds.persist_to_disk()?;

  let creds_path = root.credentials_dir().get_midjourney_state_path();
  if creds_path.exists() {
    std::fs::remove_file(creds_path)?;
  }
  
  Ok(())
}
