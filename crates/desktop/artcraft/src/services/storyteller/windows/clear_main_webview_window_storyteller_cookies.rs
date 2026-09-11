use crate::core::windows::main_window::constants::MAIN_WINDOW_NAME;
use errors::AnyhowResult;
use log::warn;
use tauri::webview::Cookie;
use tauri::{AppHandle, Manager};

pub fn clear_main_webview_window_storyteller_cookies(app: &AppHandle) -> AnyhowResult<()> {
  let main_webview_window = app.get_webview_window(MAIN_WINDOW_NAME)
      .ok_or_else(|| anyhow::anyhow!("Main window not found"))?;
  
  let cookies = main_webview_window.cookies()?;
  
  let cookies_to_delete = get_cookies_to_delete(cookies);
  
  let mut maybe_error = None;
  
  for cookie in cookies_to_delete {
    if let Err(err) = main_webview_window.delete_cookie(cookie) {
      warn!("Failed to delete cookie: {:?}", err);
      maybe_error = Some(err);
    }
  }
  
  if let Some(err) = maybe_error {
    return Err(anyhow::anyhow!("Failed to delete some cookies. Here's one failure: {:?}", err));
  }
  
  Ok(())
}

// TODO: This will need to handle local development, too.
fn get_cookies_to_delete(cookies: Vec<Cookie>) -> Vec<Cookie> {
  cookies.into_iter()
      .filter(|cookie| {
        // Define your filtering logic here
        // For example, delete cookies with a specific name or domain
        match cookie.domain() {
          // storyteller.ai
          Some("api.storyteller.ai") => true,
          Some("storyteller.ai") => true,
          Some(domain) if domain.ends_with(".storyteller.ai") => true,
          // getartcraft.com
          Some("api.getartcraft.com") => true,
          Some("getartcraft.com") => true,
          Some(domain) if domain.ends_with(".getartcraft.com") => true,
          // artcraft.ai
          Some("api.artcraft.ai") => true,
          Some("artcraft.ai") => true,
          Some(domain) if domain.ends_with(".artcraft.ai") => true,
          // ignore all others
          None => false,
          Some(domain) => {
            warn!("Ignoring cookie with unrecognized domain: {}", domain);
            false
          }
        }
      })
      .collect()
}