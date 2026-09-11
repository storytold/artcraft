use crate::core::commands::response::shorthand::{Response, SimpleResponse};
use crate::core::state::data_dir::app_data_root::AppDataRoot;
use crate::services::worldlabs::state::worldlabs_credential_manager::WorldlabsCredentialManager;
use errors::AnyhowResult;
use log::{error, info};
use serde_derive::Deserialize;
use tauri::State;

#[tauri::command]
pub async fn worldlabs_clear_credentials_command(
  root: State<'_, AppDataRoot>,
  creds_manager: State<'_, WorldlabsCredentialManager>,
) -> SimpleResponse {
  info!("worldlabs_clear_credentials_command called");

  clear_creds(&root, &creds_manager)
      .map_err(|err| {
        error!("Error clearing creds: {:?}", err);
        "error clearing creds"
      })?;

  Ok(().into())
}

fn clear_creds(
  root: &AppDataRoot,
  creds: &WorldlabsCredentialManager,
) -> AnyhowResult<()> {

  info!("Clearing credentials...");
  creds.clear_credentials()?;
  
  info!("Persisting to disk...");
  creds.persist_to_disk()?;

  let creds_path = root.credentials_dir().get_worldlabs_state_path();
  
  if creds_path.exists() {
    info!("Removing from disk...");
    std::fs::remove_file(creds_path)?;
  }
  
  Ok(())
}
