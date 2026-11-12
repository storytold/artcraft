use crate::updates::{UpdateInfo, Updates};
use std::sync::Arc;
use tauri::{AppHandle, State};

#[tauri::command]
pub async fn check_for_updates_command(app: AppHandle, updates: State<'_, Arc<Updates>>) -> Result<UpdateInfo, String> {
  let state = Arc::clone(updates.inner());
  let operation = state.begin()?;
  tauri::async_runtime::spawn_blocking(move || {
    let _operation = operation;
    state.check(&app)
  })
  .await
  .map_err(|error| format!("The update check stopped unexpectedly: {error}"))?
}
