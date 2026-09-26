use tauri::State;

use crate::services::storyteller::commands::login_bridge::{
  cancel_challenge, DesktopLoginBridgeState, DesktopLoginError,
};

#[tauri::command]
pub async fn storyteller_cancel_login_challenge_command(
  state: State<'_, DesktopLoginBridgeState>,
  challenge_id: String,
) -> Result<(), DesktopLoginError> {
  cancel_challenge(&state, &challenge_id).await;
  Ok(())
}
