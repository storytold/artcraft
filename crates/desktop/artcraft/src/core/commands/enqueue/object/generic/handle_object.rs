use crate::core::commands::enqueue::object::enqueue_image_to_3d_object_command::EnqueueImageTo3dObjectRequest;
use crate::core::commands::enqueue::object::generic::handle_object_artcraft::handle_object_artcraft;
use crate::core::commands::enqueue::object::generic::handle_object_fal::handle_object_fal;
use crate::core::commands::enqueue::object::internal_object_error::InternalObjectError;
use crate::core::commands::enqueue::task_enqueue_success::TaskEnqueueSuccess;
use crate::core::state::app_env_configs::app_env_configs::AppEnvConfigs;
use crate::core::state::data_dir::app_data_root::AppDataRoot;
use crate::core::state::provider_priority::{Provider, ProviderPriorityStore};
use crate::services::fal::state::fal_credential_manager::FalCredentialManager;
use crate::services::fal::state::fal_task_queue::FalTaskQueue;
use crate::services::storyteller::state::storyteller_credential_manager::StorytellerCredentialManager;
use tauri::AppHandle;

pub async fn handle_object(
  request: EnqueueImageTo3dObjectRequest,
  app: &AppHandle,
  app_env_configs: &AppEnvConfigs,
  app_data_root: &AppDataRoot,
  provider_priority_store: &ProviderPriorityStore,
  fal_creds_manager: &FalCredentialManager,
  storyteller_creds_manager: &StorytellerCredentialManager,
  fal_task_queue: &FalTaskQueue,
) -> Result<TaskEnqueueSuccess, InternalObjectError> {

  let priority = provider_priority_store.get_priority()?;

  for provider in priority.iter() {
    match provider {
      Provider::Sora => {} // Fallthrough
      Provider::Artcraft => {
        return Ok(handle_object_artcraft(
          request,
          app,
          app_env_configs,
          app_data_root,
          storyteller_creds_manager
        ).await?);
      }
      Provider::Fal => {
        if fal_creds_manager.has_apparent_api_token()? {
          return Ok(handle_object_fal(
            &app,
            app_env_configs,
            app_data_root,
            request,
            fal_creds_manager,
            fal_task_queue
          ).await?);
        }
      }
    }
  }

  Err(InternalObjectError::NoProviderAvailable)
}
