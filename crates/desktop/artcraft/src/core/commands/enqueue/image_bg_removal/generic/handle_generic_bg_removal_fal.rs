use crate::core::commands::enqueue::image_bg_removal::enqueue_image_bg_removal_command::EnqueueImageBgRemovalCommand;
use crate::core::commands::enqueue::image_bg_removal::errors::InternalBgRemovalError;
use crate::core::commands::enqueue::image_bg_removal::success_event::EnqueueImageBgRemovalSuccessEvent;
use crate::core::state::app_env_configs::app_env_configs::AppEnvConfigs;
use crate::core::state::data_dir::app_data_root::AppDataRoot;
use crate::services::fal::state::fal_credential_manager::FalCredentialManager;
use crate::services::fal::state::fal_task_queue::FalTaskQueue;
use tauri::AppHandle;

pub async fn handle_generic_bg_removal_fal(
  request: &EnqueueImageBgRemovalCommand,
  app: &AppHandle,
  app_data_root: &AppDataRoot,
  app_env_configs: &AppEnvConfigs,
  fal_creds_manager: &FalCredentialManager,
  fal_task_queue: &FalTaskQueue,
) -> Result<EnqueueImageBgRemovalSuccessEvent, InternalBgRemovalError> {
  unimplemented!("TODO: Implement fal background removal handling");
}
