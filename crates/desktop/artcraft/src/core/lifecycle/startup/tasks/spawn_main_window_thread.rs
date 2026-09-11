use crate::core::state::data_dir::app_data_root::AppDataRoot;
use crate::core::threads::main_window_thread::main_window_thread::main_window_thread;
use crate::services::storyteller::state::storyteller_credential_manager::StorytellerCredentialManager;
use errors::AnyhowResult;
use tauri::{AppHandle, Manager};

pub fn spawn_main_window_thread(
  app: &AppHandle,
  root: &AppDataRoot,
  storyteller_creds_manager: &StorytellerCredentialManager,
) -> AnyhowResult<()> {

  tauri::async_runtime::spawn(main_window_thread(
    app.clone(),
    root.clone(),
    storyteller_creds_manager.clone(),
  ));

  Ok(())
}
