use crate::updates::Updates;
use std::sync::Arc;
use tauri::{AppHandle, State};

#[tauri::command]
pub async fn install_update_command(app: AppHandle, updates: State<'_, Arc<Updates>>, confirmed: bool) -> Result<(), String> {
  if !confirmed {
    return Err("Confirm that you saved your work before installing the update.".into());
  }
  let state = Arc::clone(updates.inner());
  let operation = state.begin()?;
  tauri::async_runtime::spawn_blocking(move || {
    let _operation = operation;
    state.install(&app)
  })
  .await
  .map_err(|error| format!("The update installer stopped unexpectedly: {error}"))?
}
