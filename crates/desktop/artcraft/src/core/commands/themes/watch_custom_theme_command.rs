use crate::core::commands::themes::subscription::{ActiveThemeSubscription, ThemeSubscription};
use crate::themes::palette::{theme_path, ThemeUpdate};
use crate::themes::watcher::ThemeWatcher;
use serde::Serialize;
use tauri::{Emitter, State, WebviewWindow};

#[derive(Clone, Serialize)]
#[serde(rename_all = "camelCase")]
struct ThemeEvent {
  subscription_id: String,
  update: ThemeUpdate,
}

/// No path parameter: only the main desktop webview can subscribe to theme.json.
#[tauri::command]
pub async fn watch_custom_theme_command(window: WebviewWindow, state: State<'_, ThemeSubscription>, subscription_id: String) -> Result<(), String> {
  if window.label() != "main" || subscription_id.len() > 64 || subscription_id.is_empty() {
    return Err("Invalid theme subscription.".into());
  }
  let path = theme_path().ok_or("Cannot locate the configuration directory.")?;
  let mut active = state.active.lock().map_err(|_| "Cannot access the theme subscription.")?;
  // Replacing a subscription also cleans up a previous webview session on reload.
  active.take();
  let event_id = subscription_id.clone();
  let watcher = ThemeWatcher::start(path, move |update| window.emit("artcraft-custom-theme", ThemeEvent { subscription_id: event_id.clone(), update }).is_ok())?;
  *active = Some(ActiveThemeSubscription { id: subscription_id, _watcher: watcher });
  Ok(())
}
