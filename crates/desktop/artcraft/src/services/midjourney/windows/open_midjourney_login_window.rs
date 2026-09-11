use crate::core::state::data_dir::app_data_root::AppDataRoot;
use crate::core::utils::clear_all_webview_cookies::clear_all_webview_cookies;
use crate::services::midjourney::state::midjourney_credential_manager::MidjourneyCredentialManager;
use crate::services::midjourney::windows::midjourney_login_window_thread::midjourney_login_window_thread;
use anyhow::anyhow;
use errors::AnyhowResult;
use once_cell::sync::Lazy;
use reqwest::Url;
use std::time::Duration;
use tauri::{AppHandle, Manager, WebviewUrl, WebviewWindowBuilder};

/// Name of the window
pub (super) const MIDJOURNEY_LOGIN_WINDOW_NAME: &str = "midjourney_login_window";

pub (super) const MIDJOURNEY_START_URL_STR: &str = "https://google.com";

pub (super) static START_URL: Lazy<Url> = Lazy::new(|| {
  Url::parse(MIDJOURNEY_START_URL_STR).expect("URL should parse")
});

pub (super) const MIDJOURNEY_HOMEPAGE_URL_STR: &str = "https://www.midjourney.com/";

pub (super) static MIDJOURNEY_HOMEPAGE_URL: Lazy<Url> = Lazy::new(|| {
  Url::parse(MIDJOURNEY_HOMEPAGE_URL_STR).expect("URL should parse")
});

pub (super) const MIDJOURNEY_LOGIN_URL_STR: &str = "https://www.midjourney.com/auth/signin";

pub (super) static MIDJOURNEY_LOGIN_URL: Lazy<Url> = Lazy::new(|| {
  Url::parse(MIDJOURNEY_LOGIN_URL_STR).expect("URL should parse")
});

pub async fn open_midjourney_login_window(
  app: &AppHandle,
  app_data_root: &AppDataRoot,
  mj_creds_manager: &MidjourneyCredentialManager,
) -> AnyhowResult<()> {
  if app.get_window(MIDJOURNEY_LOGIN_WINDOW_NAME).is_some() {
    return Err(anyhow!("Login window already open"));
  }

  let url = WebviewUrl::External(START_URL.clone());

  let window = WebviewWindowBuilder::new(app, MIDJOURNEY_LOGIN_WINDOW_NAME, url)
      //.user_agent(openai_sora_client::credentials::USER_AGENT)
      .always_on_top(false)
      .title("Login to Midjourney")
      .center()
      .resizable(true)
      .visible(true)
      .closable(true)
      .min_inner_size(200.0, 800.0)
      .focused(true)
      .devtools(true)
      .build()?;

  let webview = window.get_webview(MIDJOURNEY_LOGIN_WINDOW_NAME)
      .ok_or_else(|| anyhow!("no webview found"))?;

  clear_all_webview_cookies(&webview)?;

  webview.navigate(MIDJOURNEY_HOMEPAGE_URL.clone())?;

  // NB: We're starting to get Cloudflare protection screens. Let's try to avoid.
  tokio::time::sleep(Duration::from_millis(100)).await;

  webview.navigate(MIDJOURNEY_LOGIN_URL.clone())?;

  let app_handle = app.clone();
  let app_data_root = app_data_root.clone();
  let mj_creds_manager= mj_creds_manager.clone();

  let _ = tauri::async_runtime::spawn(async move {
    midjourney_login_window_thread(app_handle, app_data_root, mj_creds_manager).await;
  });

  Ok(())
}
