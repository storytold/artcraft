use crate::core::events::basic_sendable_event_trait::BasicSendableEvent;
use crate::core::events::functional_events::refresh_account_state_event::RefreshAccountStateEvent;
use crate::core::events::generation_events::common::{GenerationAction, GenerationServiceProvider};
use crate::core::events::generation_events::generation_complete_event::GenerationCompleteEvent;
use crate::core::events::sendable_event_trait::SendableEvent;
use crate::core::state::data_dir::app_data_root::AppDataRoot;
use crate::core::utils::window::get_webview_window_hostname::get_webview_window_hostname;
use crate::services::midjourney::state::midjourney_credential_manager::MidjourneyCredentialManager;
use crate::services::midjourney::state::midjourney_user_info::MidjourneyUserInfo;
use crate::services::midjourney::windows::extract_midjourney_webview_cookies::extract_midjourney_webview_cookies;
use crate::services::midjourney::windows::open_midjourney_login_window::MIDJOURNEY_LOGIN_WINDOW_NAME;
use crate::services::sora::events::sora_login_success_event::SoraLoginSuccessEvent;
use crate::services::sora::state::sora_credential_manager::SoraCredentialManager;
use crate::services::sora::windows::sora_login_window::extract_sora_webview_cookies::extract_sora_webview_cookies;
use anyhow::anyhow;
use cookie_store::cookie_store::CookieStore;
use enums::common::generation_provider::GenerationProvider;
use errors::AnyhowResult;
use log::{error, info};
use midjourney_client::client::midjourney_hostname::MidjourneyHostname;
use midjourney_client::credentials::cookie_store_has_auth_cookies::cookie_store_has_auth_cookies;
use midjourney_client::recipes::get_user_info::{get_user_info, GetUserInfoRequest};
use openai_sora_client::creds::sora_credential_set::SoraCredentialSet;
use openai_sora_client::recipes::maybe_upgrade_or_renew_session::maybe_upgrade_or_renew_session;
use openai_sora_client::utils::has_session_cookie::{has_session_cookie, SessionCookiePresence};
use tauri::{AppHandle, Manager, WebviewWindow};

pub async fn midjourney_login_window_thread(
  app: AppHandle,
  app_data_root: AppDataRoot,
  mj_creds_manager: MidjourneyCredentialManager,
) {
  let mut visited_login = false;

  loop {
    let login_webview_window = match app.get_webview_window(MIDJOURNEY_LOGIN_WINDOW_NAME) {
      Some(webview) => webview,
      None => {
        info!("Exit midjourney login thread.");
        return; // NB: Only exit if we don't have the webview.
      }
    };

    let result = check_login_window(
      &app,
      &login_webview_window,
      &app_data_root,
      &mj_creds_manager,
      &mut visited_login,
    ).await;

    match result {
      Err(err) => {
        error!("Error checking login window: {:?}", err);
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

/// Returns true if we can exit.
async fn check_login_window(
  app_handle: &AppHandle,
  webview_window: &WebviewWindow,
  app_data_root: &AppDataRoot,
  mj_creds_manager: &MidjourneyCredentialManager,
  visited_login: &mut bool,
) -> AnyhowResult<bool> {

  /* Login flow looks like this:

  1. Start: https://www.midjourney.com/auth/signin
  2. SSO / Google Login (etc): https://accounts.google.com/v3/signin/challenge/pwd?[query]
  3. Done / Landing: https://www.midjourney.com/...
   */

  let hostname = get_webview_window_hostname(webview_window)?;

  let mut maybe_at_destination = false;

  match hostname.as_str() {
    "www.midjourney.com" |
    "midjourney.com"
    => {
      maybe_at_destination = true;
    }
    // chatgpt.com/auth is also an auth domain
    "auth.openai.com" |
    "accounts.google.com" |
    "accounts.youtube.com" |
    "login.live.com" |
    "appleid.apple.com"
    => {
      // NB: We're in auth flow.
      info!("Midjourney webview is in auth flow; hostname `{}`.", hostname);
      *visited_login = true;
      return Ok(false)
    }
    _ => {}, // We just don't know...
  }

  let cookie_store = extract_midjourney_webview_cookies(webview_window)?;

  let maybe_has_auth_cookies = cookie_store_has_auth_cookies(&cookie_store);
  let maybe_has_enough_cookies = cookie_store.len() > 6;
  let maybe_completed_login_cycle = *visited_login && maybe_at_destination;

  // Misc cookies without login cookies are ~1055 length
  // AUTH_I is ~1500 length
  // AUTH_R is ~500 length
  let maybe_has_big_enough_cookie = cookie_store.calculate_approx_cookie_character_length() > 2100;

  let mut heuristic_count = 0;

  if maybe_has_auth_cookies {
    heuristic_count += 1;
  }
  if maybe_has_enough_cookies {
    heuristic_count += 1;
  }
  if maybe_completed_login_cycle {
    heuristic_count += 1;
  }
  if maybe_has_big_enough_cookie {
    heuristic_count += 1;
  }

  if heuristic_count < 3 {
    return Ok(false);
  }

  info!("Heuristic count is ({}); we're likely done.", heuristic_count);

  info!("Current cookies (len {}): {:?}", cookie_store.len(), cookie_store.to_cookie_string());

  let response = get_user_info(GetUserInfoRequest {
    hostname: MidjourneyHostname::Standard,
    cookie_header: cookie_store.to_cookie_string(),
  }).await;
  
  match response {
    Err(err) => {
      error!("Error getting midjourney user info: {:?}", err);
      // NB: Fall through. Allow us to update the cookies.
    }
    Ok(user_info) => {
      info!("Got midjourney user info: {:?}", user_info);
      let user_info = MidjourneyUserInfo::from_api_response(user_info);
      
      if let Err(err) = mj_creds_manager.replace_user_info(user_info) {
        error!("Error saving midjourney user info: {:?}", err);
        // NB: Fall through. Allow us to update the cookies.
      }
    }
  }

  mj_creds_manager.replace_cookie_store(cookie_store)?;

  let result = mj_creds_manager.persist_to_disk();

  if let Err(err) = result {
    error!("Error persisting midjourney cookies to disk: {:?}", err);
    return Ok(false);
  }

  let event = RefreshAccountStateEvent {
    provider: Some(GenerationProvider::Midjourney),
  };

  if let Err(err) = event.send(&app_handle) {
    error!("Failed to send RefreshAccountStateEvent: {:?}", err); // Fail open
  }

  Ok(true)
}

