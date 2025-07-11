use crate::core::lifecycle::startup::bootstrap_task_database::bootstrap_task_database;
use crate::core::state::data_dir::app_data_root::AppDataRoot;
use errors::AnyhowResult;
use tauri::AppHandle;

pub async fn handle_tauri_startup(app: AppHandle, root: AppDataRoot) -> AnyhowResult<()> {
  bootstrap_task_database(&app, &root).await?;
  Ok(())
}
