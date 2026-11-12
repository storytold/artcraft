use crate::updates::{require_confirmation, Updates};
use std::sync::Arc;
use tauri::{AppHandle, State};

#[tauri::command]
pub async fn install_update_command(app: AppHandle, updates: State<'_, Arc<Updates>>, confirmed: bool) -> Result<(), String> {
  require_confirmation(confirmed)?;
  updates.inner().run("The update installer stopped unexpectedly", move |state| state.install(&app)).await
}
