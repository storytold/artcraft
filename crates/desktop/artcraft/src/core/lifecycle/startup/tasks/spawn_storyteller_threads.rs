use crate::core::state::app_env_configs::app_env_configs::AppEnvConfigs;
use crate::core::state::artcraft_platform_info::ArtcraftPlatformInfo;
use crate::core::state::artcraft_usage_tracker::artcraft_usage_tracker::ArtcraftUsageTracker;
use crate::core::state::task_database::TaskDatabase;
use crate::services::storyteller::state::storyteller_credential_manager::StorytellerCredentialManager;
use crate::services::storyteller::threads::storyteller_task_polling_thread::storyteller_task_polling_thread::storyteller_task_polling_thread;
use errors::AnyhowResult;
use tauri::{AppHandle, Manager};

pub fn spawn_storyteller_threads(
  app: &AppHandle,
  app_env_configs: &AppEnvConfigs,
  artcraft_usage_tracker: &ArtcraftUsageTracker,
  artcraft_platform_info: &ArtcraftPlatformInfo,
  task_database: &TaskDatabase,
  storyteller_creds_manager: &StorytellerCredentialManager,
) -> AnyhowResult<()> {
  
  tauri::async_runtime::spawn(storyteller_task_polling_thread(
    app.clone(),
    app_env_configs.clone(),
    task_database.clone(),
    storyteller_creds_manager.clone(),
  ));

  // Usage-telemetry heartbeat (storyteller_activity_thread) intentionally not started:
  // it only reported session length, OS/app version and generation counts to storyteller.ai.
  let _ = (artcraft_platform_info, artcraft_usage_tracker);

  Ok(())
}
