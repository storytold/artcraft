use crate::core::events::basic_sendable_event_trait::BasicSendableEvent;
use crate::core::events::functional_events::refresh_account_state_event::RefreshAccountStateEvent;
use crate::core::state::data_dir::app_data_root::AppDataRoot;
use crate::core::utils::window::get_webview_window_hostname::get_webview_window_hostname;
use crate::services::midjourney::state::midjourney_credential_manager::MidjourneyCredentialManager;
use crate::services::midjourney::windows::extract_midjourney_webview_cookies::extract_midjourney_webview_cookies;
use crate::services::midjourney::windows::open_midjourney_login_window::MIDJOURNEY_LOGIN_WINDOW_NAME;
use enums::common::generation_provider::GenerationProvider;
use errors::AnyhowResult;
use midjourney_client::credentials::cookie_store_has_auth_cookies::cookie_store_has_auth_cookies;
use std::time::Duration;
use tauri::{AppHandle, Manager, WebviewWindow};

pub async fn midjourney_login_window_thread(app: AppHandle, _app_data_root: AppDataRoot, credentials: MidjourneyCredentialManager) {
  loop {
    let Some(window) = app.get_webview_window(MIDJOURNEY_LOGIN_WINDOW_NAME) else {
      return;
    };
    match check_login_window(&app, &window, &credentials).await {
      Ok(true) => {
        if let Err(err) = window.close() {
          log::warn!("Could not close Midjourney login window: {}", err);
        }
        return;
      },
      Ok(false) => {},
      Err(err) => log::warn!("Could not capture Midjourney login: {}", err),
    }
    tokio::time::sleep(Duration::from_secs(2)).await;
  }
}

async fn check_login_window(app: &AppHandle, window: &WebviewWindow, credentials: &MidjourneyCredentialManager) -> AnyhowResult<bool> {
  let hostname = get_webview_window_hostname(window)?;
  if !matches!(hostname.as_str(), "www.midjourney.com" | "midjourney.com") {
    return Ok(false);
  }
  let cookies = extract_midjourney_webview_cookies(window)?;
  // As in ArtCraftX, auth cookies in a cleared login window are the signal;
  // cookie counts, lengths, and a visit to an OAuth domain are not required.
  if !cookie_store_has_auth_cookies(&cookies) {
    return Ok(false);
  }
  credentials.save_login(cookies).await?;
  RefreshAccountStateEvent { provider: Some(GenerationProvider::Midjourney) }.send_infallible(app);
  Ok(true)
}
