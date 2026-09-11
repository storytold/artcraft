use crate::core::state::data_dir::app_data_root::AppDataRoot;
use crate::core::utils::clear_all_webview_cookies::clear_all_webview_cookies;
use crate::services::worldlabs::state::worldlabs_bearer_bridge::WorldlabsBearerBridge;
use crate::services::worldlabs::state::worldlabs_credential_manager::WorldlabsCredentialManager;
use crate::services::worldlabs::windows::worldlabs_login_window::worldlabs_login_window_thread::worldlabs_login_window_thread;
use anyhow::anyhow;
use errors::AnyhowResult;
use log::info;
use once_cell::sync::Lazy;
use reqwest::Url;
use std::time::Duration;
use tauri::webview::NewWindowResponse;
use tauri::{AppHandle, Manager, WebviewUrl, WebviewWindowBuilder};

/// Name of the window
pub (super) const WORLDLABS_LOGIN_WINDOW_NAME: &str = "worldlabs_login_window";

pub (super) static START_URL: Lazy<Url> = Lazy::new(|| {
  Url::parse("https://google.com").expect("URL should parse")
});

pub (super) static WORLDLABS_HOMEPAGE_URL: Lazy<Url> = Lazy::new(|| {
  Url::parse("https://marble.worldlabs.ai/").expect("URL should parse")
});

pub (super) static WORLDLABS_LOGIN_URL: Lazy<Url> = Lazy::new(|| {
  Url::parse("https://marble.worldlabs.ai/").expect("URL should parse")
});

pub async fn worldlabs_login_window_open(
  app: &AppHandle,
  app_data_root: &AppDataRoot,
  worldlabs_bearer_bridge: &WorldlabsBearerBridge,
  worldlabs_creds_manager: &WorldlabsCredentialManager,
) -> AnyhowResult<()> {

  if app.get_window(WORLDLABS_LOGIN_WINDOW_NAME).is_some() {
    return Err(anyhow!("Login window already open"));
  }

  info!("Clearing bearer bridge...");

  worldlabs_bearer_bridge.clear()?;

  let url = WebviewUrl::External(START_URL.clone());

  let window = WebviewWindowBuilder::new(app, WORLDLABS_LOGIN_WINDOW_NAME, url)
      //.user_agent(openai_sora_client::credentials::USER_AGENT)
      .on_new_window(move |url, features| {
        // WorldLabs needs popups as they (1) don't have a distinct login page
        // (it's embedded) and (2) they don't redirect with OAuth, but rather
        // open a popup to Google. It still works, but it's annoying.
        NewWindowResponse::Allow
      })
      .always_on_top(false)
      .title("Login to WorldLabs")
      .center()
      .resizable(true)
      .visible(true)
      .closable(true)
      .min_inner_size(800.0, 800.0)
      .focused(true)
      .devtools(true)
      .build()?;

  let webview = window.get_webview(WORLDLABS_LOGIN_WINDOW_NAME)
      .ok_or_else(|| anyhow!("no webview found"))?;

  clear_all_webview_cookies(&webview)?;

  webview.navigate(WORLDLABS_HOMEPAGE_URL.clone())?;

  tokio::time::sleep(Duration::from_millis(200)).await;

  info!("Running script...");

  for _ in 0 .. 10 {
    tokio::time::sleep(Duration::from_millis(100)).await;

    // Close the "welcome" modal
    webview.eval(r#"document.querySelectorAll("div:has(h2) ~ button[data-slot=dialog-close]").forEach((el) => el.click())"#)?;
  }

  for _ in 0 .. 10 {
    tokio::time::sleep(Duration::from_millis(100)).await;

    // Open the "login" modal
    webview.eval(r#"document.querySelectorAll("button:has(span[data-slot=avatar])").forEach((el) => el.click())"#)?;
  }

  info!("Script done...");

  let app_handle = app.clone();
  let app_data_root = app_data_root.clone();
  let worldlabs_creds_manager = worldlabs_creds_manager.clone();
  let worldlabs_bearer_bridge = worldlabs_bearer_bridge.clone();

  let _ = tauri::async_runtime::spawn(async move {
    worldlabs_login_window_thread(
      app_handle,
      app_data_root,
      worldlabs_bearer_bridge,
      worldlabs_creds_manager
    ).await;
  });

  Ok(())
}
