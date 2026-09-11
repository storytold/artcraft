use crate::core::commands::enqueue::generate_error::GenerateError;
use crate::core::commands::deprecated::image_edit::enqueue_edit_image_command::{EnqueueEditImageCommand, ImageEditModel};
use crate::core::commands::deprecated::image_edit::image_edit_models::image_edit_model_to_model_type;
use crate::core::commands::deprecated::image_edit::sora::handle_sora_gpt_image_1_edit::handle_sora_gpt_image_1_edit;
use crate::core::commands::enqueue::task_enqueue_success::TaskEnqueueSuccess;
use crate::core::state::app_env_configs::app_env_configs::AppEnvConfigs;
use crate::core::state::data_dir::app_data_root::AppDataRoot;
use crate::services::sora::state::sora_credential_manager::SoraCredentialManager;
use crate::services::sora::state::sora_task_queue::SoraTaskQueue;
use enums::common::generation_provider::GenerationProvider;
use tauri::AppHandle;

pub async fn handle_image_edit_sora(
  model: ImageEditModel,
  request: &EnqueueEditImageCommand,
  app: &AppHandle,
  app_data_root: &AppDataRoot,
  app_env_configs: &AppEnvConfigs,
  sora_creds_manager: &SoraCredentialManager,
  sora_task_queue: &SoraTaskQueue,
) -> Result<TaskEnqueueSuccess, GenerateError> {
  match model {
    ImageEditModel::GptImage1 => {
      handle_sora_gpt_image_1_edit(
        request,
        app,
        app_data_root,
        app_env_configs,
        sora_creds_manager,
        sora_task_queue,
      ).await
    },
    _ => {
      Err(GenerateError::BadProviderForModel {
        provider: GenerationProvider::Sora,
        model: image_edit_model_to_model_type(model),
      })
    }
  }
}
