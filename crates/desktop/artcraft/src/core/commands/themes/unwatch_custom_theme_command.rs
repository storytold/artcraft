use crate::core::commands::themes::subscription::ThemeSubscription;
use tauri::{State, WebviewWindow};

#[tauri::command]
pub async fn unwatch_custom_theme_command(window: WebviewWindow, state: State<'_, ThemeSubscription>, subscription_id: String) -> Result<(), String> {
  if window.label() != "main" {
    return Err("Invalid theme subscription.".into());
  }
  let mut active = state.active.lock().map_err(|_| "Cannot access the theme subscription.")?;
  // A late cleanup must never stop a newer selection (including React StrictMode).
  if active.as_ref().is_some_and(|subscription| subscription.id == subscription_id) {
    active.take();
  }
  Ok(())
}
