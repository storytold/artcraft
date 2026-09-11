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
use crate::services::grok::state::grok_credential_manager::GrokCredentialManager;
use crate::services::grok::windows::grok_login_window::grok_login_window_thread::grok_login_window_thread;

/// Name of the window
pub (super) const GROK_LOGIN_WINDOW_NAME: &str = "grok_login_window";

pub (super) static START_URL: Lazy<Url> = Lazy::new(|| {
  Url::parse("https://google.com").expect("URL should parse")
});

pub (super) static GROK_HOMEPAGE_URL: Lazy<Url> = Lazy::new(|| {
  Url::parse("https://grok.com/").expect("URL should parse")
});

pub (super) static GROK_LOGIN_URL: Lazy<Url> = Lazy::new(|| {
  Url::parse("https://accounts.x.ai/sign-in?redirect=grok-com").expect("URL should parse")
});

pub async fn grok_login_window_open(
  app: &AppHandle,
  app_data_root: &AppDataRoot,
  grok_creds_manager: &GrokCredentialManager,
) -> AnyhowResult<()> {
  if app.get_window(GROK_LOGIN_WINDOW_NAME).is_some() {
    return Err(anyhow!("Login window already open"));
  }

  let url = WebviewUrl::External(START_URL.clone());

  let window = WebviewWindowBuilder::new(app, GROK_LOGIN_WINDOW_NAME, url)
      //.user_agent(openai_sora_client::credentials::USER_AGENT)
      .always_on_top(false)
      .title("Login to Grok")
      .center()
      .resizable(true)
      .visible(true)
      .closable(true)
      .min_inner_size(200.0, 800.0)
      .focused(true)
      .devtools(true)
      .build()?;

  let webview = window.get_webview(GROK_LOGIN_WINDOW_NAME)
      .ok_or_else(|| anyhow!("no webview found"))?;

  clear_all_webview_cookies(&webview)?;

  webview.navigate(GROK_HOMEPAGE_URL.clone())?;

  // NB: We're starting to get Cloudflare protection screens. Let's try to avoid.
  tokio::time::sleep(Duration::from_millis(100)).await;

  webview.navigate(GROK_LOGIN_URL.clone())?;

  let app_handle = app.clone();
  let app_data_root = app_data_root.clone();
  let grok_creds_manager= grok_creds_manager.clone();

  let _ = tauri::async_runtime::spawn(async move {
    grok_login_window_thread(app_handle, app_data_root, grok_creds_manager).await;
  });

  Ok(())
}
