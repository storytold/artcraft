use crate::core::events::basic_sendable_event_trait::BasicSendableEvent;
use crate::core::events::functional_events::refresh_account_state_event::RefreshAccountStateEvent;
use crate::core::events::generation_events::common::{GenerationAction, GenerationServiceProvider};
use crate::core::events::generation_events::generation_complete_event::GenerationCompleteEvent;
use crate::core::events::sendable_event_trait::SendableEvent;
use crate::core::state::data_dir::app_data_root::AppDataRoot;
use crate::core::utils::window::get_webview_window_hostname::get_webview_window_hostname;
use crate::core::utils::window::get_webview_window_url_path::get_webview_window_url_path;
use crate::services::grok::state::grok_credential_manager::GrokCredentialManager;
use crate::services::sora::events::sora_login_success_event::SoraLoginSuccessEvent;
use crate::services::sora::state::sora_credential_manager::SoraCredentialManager;
use crate::services::sora::windows::sora_login_window::extract_sora_webview_cookies::extract_sora_webview_cookies;
use crate::services::worldlabs::state::worldlabs_bearer_bridge::WorldlabsBearerBridge;
use crate::services::worldlabs::state::worldlabs_credential_manager::WorldlabsCredentialManager;
use crate::services::worldlabs::windows::worldlabs_login_window::worldlabs_javascript::WORLDLABS_JAVASCRIPT_EXPORT_BEARER_TOKENS;
use crate::services::worldlabs::windows::worldlabs_login_window::worldlabs_login_webview_extract_cookies::worldlabs_login_webview_extract_cookies;
use crate::services::worldlabs::windows::worldlabs_login_window::worldlabs_login_window_open::WORLDLABS_LOGIN_WINDOW_NAME;
use anyhow::anyhow;
use cookie_store::cookie_store::CookieStore;
use enums::common::generation_provider::GenerationProvider;
use errors::AnyhowResult;
use log::{error, info};
use openai_sora_client::creds::sora_credential_set::SoraCredentialSet;
use openai_sora_client::recipes::maybe_upgrade_or_renew_session::maybe_upgrade_or_renew_session;
use openai_sora_client::utils::has_session_cookie::{has_session_cookie, SessionCookiePresence};
use tauri::{AppHandle, Manager, WebviewWindow};
use worldlabs_consumer_client::credentials::world_labs_bearer_token::WorldLabsBearerToken;
use worldlabs_consumer_client::credentials::worldlabs_refresh_token::WorldLabsRefreshToken;

pub async fn worldlabs_login_window_thread(
  app: AppHandle,
  app_data_root: AppDataRoot,
  worldlabs_bearer_bridge: WorldlabsBearerBridge,
  worldlabs_creds_manager: WorldlabsCredentialManager,
) {
  let mut visited_login = false;

  loop {
    let login_webview_window = match app.get_webview_window(WORLDLABS_LOGIN_WINDOW_NAME) {
      Some(webview) => webview,
      None => {
        info!("Exit WorldLabs login thread.");
        return; // NB: Only exit if we don't have the webview.
      }
    };

    let result = check_login_window(
      &app,
      &login_webview_window,
      &app_data_root,
      &worldlabs_bearer_bridge,
      &worldlabs_creds_manager,
      &mut visited_login,
    ).await;

    match result {
      Err(err) => {
        error!("Error checking Grok login window: {:?}", err);
      }
      Ok(false) => {} // Continue iteration and try again...
      Ok(true) => {
        info!("Successfully saved cookies from login window. Closing.");
        if let Err(err) = login_webview_window.close() {
          error!("Error closing login window: {:?}", err);
        }
        return;
      }
    }

    tokio::time::sleep(std::time::Duration::from_millis(2_000)).await;
  }
}

/// NOTE: THERE IS THIS - https://marble.worldlabs.ai/sign-in?redirect=%2Fworlds

/// Returns true if we can exit.
async fn check_login_window(
  app_handle: &AppHandle,
  webview_window: &WebviewWindow,
  app_data_root: &AppDataRoot,
  worldlabs_bearer_bridge: &WorldlabsBearerBridge,
  worldlabs_creds_manager: &WorldlabsCredentialManager,
  visited_login: &mut bool,
) -> AnyhowResult<bool> {

  // World labs has no distinct login page. Everything is in a single SPA.

  webview_window.eval(WORLDLABS_JAVASCRIPT_EXPORT_BEARER_TOKENS)?;

  let maybe_bearer = worldlabs_bearer_bridge.get()?;

  let bearer_info = match maybe_bearer {
    Some(bearer) => bearer,
    None => {
      return Ok(false); // Not logged in.
    }
  };

  let cookie_store = worldlabs_login_webview_extract_cookies(webview_window)?;

  info!("Current cookies (len {}): {:?}", cookie_store.len(), cookie_store.to_cookie_string());

  worldlabs_creds_manager.replace_cookie_store(cookie_store)?;
  
  let bearer_token = WorldLabsBearerToken::new(bearer_info.bearer_token);
  
  worldlabs_creds_manager.replace_bearer_token(bearer_token)?;

  let refresh_token = WorldLabsRefreshToken::new(bearer_info.refresh_token);

  worldlabs_creds_manager.replace_refresh_token(refresh_token)?;

  let result = worldlabs_creds_manager.persist_to_disk();

  if let Err(err) = result {
    error!("Error persisting WorldLabs credentials to disk: {:?}", err);
    return Ok(false);
  }

  let event = RefreshAccountStateEvent {
    provider: Some(GenerationProvider::WorldLabs),
  };

  if let Err(err) = event.send(&app_handle) {
    error!("Failed to send RefreshAccountStateEvent: {:?}", err); // Fail open
  }

  Ok(true)
}
