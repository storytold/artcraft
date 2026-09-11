use crate::core::state::data_dir::app_data_root::AppDataRoot;
use crate::core::utils::clear_all_webview_cookies::clear_all_webview_cookies;
use crate::services::sora::state::sora_credential_manager::SoraCredentialManager;
use crate::services::sora::windows::sora_login_window::sora_login_thread::sora_login_thread;
use anyhow::anyhow;
use errors::AnyhowResult;
use once_cell::sync::Lazy;
use reqwest::Url;
use std::time::Duration;
use tauri::{AppHandle, Manager, WebviewUrl, WebviewWindowBuilder};

/// Name of the window
pub (super) const LOGIN_WINDOW_NAME: &str = "login_window";

pub (super) static START_URL: Lazy<Url> = Lazy::new(|| {
  Url::parse("https://google.com").expect("URL should parse")
});

pub (super) static SORA_HOMEPAGE_URL : Lazy<Url> = Lazy::new(|| {
  Url::parse("https://sora.com/").expect("URL should parse")
});

pub (super) static SORA_LOGIN_URL: Lazy<Url> = Lazy::new(|| {
  Url::parse("https://chatgpt.com/auth/login?next=%2Fsora%2F").expect("URL should parse")
});

//pub const SORA_ROOT_URL_STR: &str = "https://sora.com/";
//
//pub static SORA_ROOT_URL: Lazy<Url> = Lazy::new(|| {
//  Url::parse(SORA_ROOT_URL_STR).expect("URL should parse")
//});

pub async fn open_sora_login_window(
  app: &AppHandle,
  app_data_root: &AppDataRoot,
  sora_creds_manager: &SoraCredentialManager,
) -> AnyhowResult<()> {
  if app.get_window(LOGIN_WINDOW_NAME).is_some() {
    return Err(anyhow!("Login window already open"));
  }

  let url = WebviewUrl::External(START_URL.clone());

  let window = WebviewWindowBuilder::new(app, LOGIN_WINDOW_NAME, url)
      //.user_agent(openai_sora_client::credentials::USER_AGENT)
      .always_on_top(true)
      .title("Login to OpenAI's Sora")
      .center()
      .resizable(true)
      .visible(true)
      .closable(true)
      .min_inner_size(200.0, 800.0)
      .focused(true)
      .devtools(true)
      .build()?;

  let webview = window.get_webview(LOGIN_WINDOW_NAME)
      .ok_or_else(|| anyhow!("no webview found"))?;

  clear_all_webview_cookies(&webview)?;

  webview.navigate(SORA_HOMEPAGE_URL.clone())?;

  // NB: We're starting to get Cloudflare protection screens. Let's try to avoid.
  tokio::time::sleep(Duration::from_millis(100)).await;

  webview.navigate(SORA_LOGIN_URL.clone())?;
  
  let app_handle = app.clone();
  let app_data_root = app_data_root.clone();
  let sora_creds_manager = sora_creds_manager.clone();

  let _ = tauri::async_runtime::spawn(async move {
    sora_login_thread(app_handle, app_data_root, sora_creds_manager).await;
  });

  Ok(())
}
