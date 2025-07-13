use crate::core::commands::enqueue::image_edit::enqueue_contextual_edit_image_command::EnqueueContextualEditImageCommand;
use crate::core::commands::enqueue::image_edit::errors::InternalContextualEditImageError;
use crate::core::commands::enqueue::image_edit::gpt_image_1::handle_gpt_image_1_artcraft::handle_gpt_image_1_artcraft;
use crate::core::commands::enqueue::image_edit::gpt_image_1::handle_gpt_image_1_sora::handle_gpt_image_1_sora;
use crate::core::commands::enqueue::task_enqueue_success::TaskEnqueueSuccess;
use crate::core::state::app_env_configs::app_env_configs::AppEnvConfigs;
use crate::core::state::data_dir::app_data_root::AppDataRoot;
use crate::core::state::provider_priority::{Provider, ProviderPriorityStore};
use crate::services::fal::state::fal_credential_manager::FalCredentialManager;
use crate::services::fal::state::fal_task_queue::FalTaskQueue;
use crate::services::sora::state::sora_credential_manager::SoraCredentialManager;
use crate::services::sora::state::sora_task_queue::SoraTaskQueue;
use crate::services::storyteller::state::storyteller_credential_manager::StorytellerCredentialManager;
use log::info;
use tauri::AppHandle;

pub(super) const MAX_IMAGES: usize = 10;

pub async fn handle_gpt_image_1(
  request: &EnqueueContextualEditImageCommand,
  app: &AppHandle,
  app_data_root: &AppDataRoot,
  app_env_configs: &AppEnvConfigs,
  provider_priority_store: &ProviderPriorityStore,
  storyteller_creds_manager: &StorytellerCredentialManager,
  fal_creds_manager: &FalCredentialManager,
  fal_task_queue: &FalTaskQueue,
  sora_creds_manager: &SoraCredentialManager,
  sora_task_queue: &SoraTaskQueue,
) -> Result<TaskEnqueueSuccess, InternalContextualEditImageError> {

  let priority = provider_priority_store.get_priority()?;
  
  // TODO: Check if providers are available before proceeding.

  info!("Providers by priority: {:?}", priority);

  for provider in priority.iter() {
    match provider {
      Provider::Fal => {
        // Fallthrough
        // If in the future we support OpenAI API keys, it's worth considering whether we 
        // send those requests ourselves, or if we use FAL as an intermediary. FAL makes 
        // the API nicer to deal with, but the user needs an additional key.
      }
      Provider::Artcraft => {
        info!("Dispatching gpt-image-1 via Artcraft...");
        return handle_gpt_image_1_artcraft(
          request, 
          app,
          app_data_root,
          app_env_configs, 
          storyteller_creds_manager
        ).await;
      }
      Provider::Sora => {
        info!("Dispatching gpt-image-1 via Sora...");
        return handle_gpt_image_1_sora(
          request, 
          app,
          app_data_root,
          app_env_configs, 
          sora_creds_manager,
          sora_task_queue,
        ).await;
      }
    }
  }
  
  Err(InternalContextualEditImageError::NoProviderAvailable)
}
