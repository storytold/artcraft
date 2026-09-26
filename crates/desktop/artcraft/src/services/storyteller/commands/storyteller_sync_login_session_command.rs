use log::warn;
use tauri::{AppHandle, Manager, State};
use tauri_plugin_http::Http;

use crate::core::threads::main_window_thread::persist_storyteller_cookies_task::{get_credentials_from_cookie_store, sync_tauri_credentials, storyteller_cookie_url};
use crate::services::storyteller::state::storyteller_credential_manager::StorytellerCredentialManager;

/// Synchronize the HTTP plugin's newly received session with native API clients.
/// No cookie is accepted from the webview/IPC caller or created by this command.
#[tauri::command]
pub fn storyteller_sync_login_session_command(app: AppHandle, manager: State<'_, StorytellerCredentialManager>) -> Result<(), String> {
  let http = app.try_state::<Http>().ok_or("HTTP client unavailable")?;
  let jar = http.cookies_jar.store.lock().map_err(|_| "HTTP cookie store unavailable")?;
  let url = storyteller_cookie_url(&app).map_err(|_| "API configuration unavailable")?;
  let credentials = get_credentials_from_cookie_store(&jar, &url).map_err(|_| "Unable to read login session")?;
  if credentials.session.is_none() {
    return Err("The API did not set a desktop session cookie".into());
  }
  sync_tauri_credentials(&jar, &manager, &url).map_err(|error| {
    warn!("Unable to synchronize desktop login credentials: {}", error);
    "Unable to synchronize desktop login".into()
  })
}
