use tauri::State;

use crate::core::state::app_env_configs::app_env_configs::AppEnvConfigs;
use crate::services::storyteller::commands::login_bridge::{
  begin_challenge, DesktopLoginBridgeState, DesktopLoginChallenge, DesktopLoginError,
};

#[tauri::command]
pub async fn storyteller_create_login_challenge_command(
  config: State<'_, AppEnvConfigs>,
  state: State<'_, DesktopLoginBridgeState>,
) -> Result<DesktopLoginChallenge, DesktopLoginError> {
  begin_challenge(&config.storyteller_host, &state).await
}
