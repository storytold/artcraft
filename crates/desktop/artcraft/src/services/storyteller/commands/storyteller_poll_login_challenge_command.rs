use tauri::{AppHandle, State};

use crate::services::storyteller::commands::login_bridge::{
  http_cookie_jar, poll_challenge, DesktopLoginBridgeState, DesktopLoginError, DesktopLoginOutcome,
};
use crate::services::storyteller::state::storyteller_credential_manager::StorytellerCredentialManager;

#[tauri::command]
pub async fn storyteller_poll_login_challenge_command(
  app: AppHandle,
  state: State<'_, DesktopLoginBridgeState>,
  manager: State<'_, StorytellerCredentialManager>,
  challenge_id: String,
) -> Result<DesktopLoginOutcome, DesktopLoginError> {
  let jar = http_cookie_jar(&app)?;
  poll_challenge(&state, &manager, &jar, &challenge_id).await
}
