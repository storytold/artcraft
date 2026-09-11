use crate::core::state::app_env_configs::app_env_configs::AppEnvConfigs;
use crate::core::state::data_dir::app_data_root::AppDataRoot;
use crate::core::state::task_database::TaskDatabase;
use crate::services::sora::state::sora_credential_manager::SoraCredentialManager;
use crate::services::sora::state::sora_task_queue::SoraTaskQueue;
use crate::services::sora::threads::sora_task_polling::sora_task_polling_thread::sora_task_polling_thread;
use crate::services::storyteller::state::storyteller_credential_manager::StorytellerCredentialManager;
use errors::AnyhowResult;
use tauri::{AppHandle, Manager};

pub fn spawn_sora_task_polling_thread(
  app: &AppHandle,
  root: &AppDataRoot,
  app_env_configs: &AppEnvConfigs,
  task_database: &TaskDatabase,
  sora_credential_manager: &SoraCredentialManager,
  storyteller_creds_manager: &StorytellerCredentialManager,
  sora_task_queue: &SoraTaskQueue,
) -> AnyhowResult<()> {

  tauri::async_runtime::spawn(sora_task_polling_thread(
    app.clone(),
    app_env_configs.clone(),
    root.clone(),
    task_database.clone(),
    sora_credential_manager.clone(),
    storyteller_creds_manager.clone(),
    sora_task_queue.clone(),
  ));

  Ok(())
}
