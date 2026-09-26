use artcraft_api_defs::users::session_info::SessionUserInfo;
use artcraft_client::endpoints::users::password_login::PasswordLoginRequest;
use tauri::{AppHandle, State};

use crate::core::state::app_env_configs::app_env_configs::AppEnvConfigs;
use crate::services::storyteller::commands::login_bridge::{
  http_cookie_jar, password_auth, DesktopLoginError,
};
use crate::services::storyteller::state::storyteller_credential_manager::StorytellerCredentialManager;

#[tauri::command]
pub async fn storyteller_password_login_command(
  app: AppHandle,
  config: State<'_, AppEnvConfigs>,
  manager: State<'_, StorytellerCredentialManager>,
  request: PasswordLoginRequest,
) -> Result<SessionUserInfo, DesktopLoginError> {
  password_auth(
    &config.storyteller_host,
    &manager,
    &http_cookie_jar(&app)?,
    Some(request),
    None,
  )
  .await
}
