use crate::core::commands::response::shorthand::SimpleResponse;
use crate::services::sora::state::sora_credential_manager::SoraCredentialManager;
use log::{error, info};
use tauri::State;

#[tauri::command]
pub async fn sora_logout_command(
  sora_creds_manager: State<'_, SoraCredentialManager>,
) -> SimpleResponse {
  info!("sora_logout_command called");

  if let Err(err) = sora_creds_manager.purge_credentials_from_disk() {
    error!("Error purging credentials from disk: {:?}", err);
    return Err("error purging credentials from disk".into());
  }
  
  if let Err(err) = sora_creds_manager.clear_credentials() {
    error!("Error clearing credentials from memory: {:?}", err);
    return Err("error clearing credentials from memory".into());
  }
  
  if let Err(err) = sora_creds_manager.reset_credential_stats() {
    error!("Error resetting credential stats: {:?}", err);
    return Err("error resetting credential stats".into());
  }
  
  Ok(().into())
}
