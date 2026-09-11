use crate::services::sora::windows::sora_login_window::open_sora_login_window::SORA_LOGIN_URL;
use anyhow::anyhow;
use errors::AnyhowResult;
use log::info;
use tauri::Webview;

// NB: Probably best not to use this.
pub fn keep_on_login_domains(webview: &Webview) -> AnyhowResult<()> {
  let url = webview.url()?;
  let hostname= url.host()
      .ok_or(anyhow!("no host in url"))?
      .to_string();
  match hostname.as_str() {
    "auth.openai.com" => {},
    "openai.com" => {},
    "sora.com" => {},
    // Third party SSO
    "accounts.google.com" => {},
    "accounts.youtube.com" => {},
    "login.live.com" => {},
    "appleid.apple.com" => {},
    _ => {
      info!("Non login hostname: {}", hostname);
      webview.navigate(SORA_LOGIN_URL.clone())?;
    }
  }
  Ok(())
}
