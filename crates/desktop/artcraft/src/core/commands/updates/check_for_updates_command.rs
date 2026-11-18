use crate::updates::{UpdateInfo, Updates};
use std::sync::Arc;
use tauri::{AppHandle, State};

#[tauri::command]
pub async fn check_for_updates_command(app: AppHandle, updates: State<'_, Arc<Updates>>) -> Result<UpdateInfo, String> {
  updates.inner().run("The update check stopped unexpectedly", move |state| state.check(&app)).await
}
