use crate::core::commands::themes::subscription::ThemeSubscription;
use tauri::{State, WebviewWindow};

#[tauri::command]
pub async fn unwatch_custom_theme_command(window: WebviewWindow, state: State<'_, ThemeSubscription>, subscription_id: String) -> Result<(), String> {
  if window.label() != "main" {
    return Err("Invalid theme subscription.".into());
  }
  state.stop(&subscription_id)
}
