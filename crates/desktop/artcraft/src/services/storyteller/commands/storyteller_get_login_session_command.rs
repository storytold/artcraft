use artcraft_api_defs::users::session_info::SessionUserInfo;
use artcraft_client::utils::login_challenge_client::LoginChallengeClient;
use tauri::{AppHandle, State};

use crate::core::state::app_env_configs::app_env_configs::AppEnvConfigs;
use crate::services::storyteller::commands::login_bridge::{
  current_login_session, http_cookie_jar, DesktopLoginError,
};

#[tauri::command]
pub async fn storyteller_get_login_session_command(
  app: AppHandle,
  config: State<'_, AppEnvConfigs>,
) -> Result<Option<SessionUserInfo>, DesktopLoginError> {
  let client = LoginChallengeClient::new(&config.storyteller_host).map_err(|error| {
    DesktopLoginError::from_client(&config.storyteller_host.to_api_hostname_and_scheme(), error)
  })?;
  current_login_session(&client, &http_cookie_jar(&app)?).await
}
