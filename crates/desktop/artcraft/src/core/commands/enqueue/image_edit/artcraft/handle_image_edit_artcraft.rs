use crate::core::commands::enqueue::generate_error::GenerateError;
use crate::core::commands::enqueue::image_edit::artcraft::handle_artcraft_flux_kontext_edit::handle_artcraft_flux_kontext_edit;
use crate::core::commands::enqueue::image_edit::artcraft::handle_artcraft_gpt_image_1_edit::handle_artcraft_gpt_image_1_edit;
use crate::core::commands::enqueue::image_edit::artcraft::handle_image_edit_artcraft_via_router::handle_image_edit_artcraft_via_router;
use crate::core::commands::enqueue::image_edit::enqueue_edit_image_command::{EnqueueEditImageCommand, ImageEditModel};
use crate::core::commands::enqueue::task_enqueue_success::TaskEnqueueSuccess;
use crate::core::events::generation_events::common::GenerationModel;
use crate::core::state::app_env_configs::app_env_configs::AppEnvConfigs;
use crate::core::state::data_dir::app_data_root::AppDataRoot;
use crate::services::storyteller::state::storyteller_credential_manager::StorytellerCredentialManager;
use artcraft_router::api::common_image_model::CommonImageModel;
use tauri::AppHandle;

pub async fn handle_image_edit_artcraft(
  model: ImageEditModel,
  request: &EnqueueEditImageCommand,
  app: &AppHandle,
  app_data_root: &AppDataRoot,
  app_env_configs: &AppEnvConfigs,
  storyteller_creds_manager: &StorytellerCredentialManager,
) -> Result<TaskEnqueueSuccess, GenerateError> {
  
  match model {
    ImageEditModel::FluxProKontextMax => handle_artcraft_flux_kontext_edit(request, app, app_data_root, app_env_configs, storyteller_creds_manager).await,
    ImageEditModel::Gemini25Flash | ImageEditModel::NanoBanana => {
      handle_image_edit_artcraft_via_router(request, app_env_configs, storyteller_creds_manager, CommonImageModel::NanaBanana, GenerationModel::NanoBanana).await
    },
    ImageEditModel::NanoBanana2 => handle_image_edit_artcraft_via_router(request, app_env_configs, storyteller_creds_manager, CommonImageModel::NanaBanana2, GenerationModel::NanoBanana2).await,
    ImageEditModel::NanoBananaPro => handle_image_edit_artcraft_via_router(request, app_env_configs, storyteller_creds_manager, CommonImageModel::NanaBananaPro, GenerationModel::NanoBananaPro).await,
    ImageEditModel::GptImage1 => handle_artcraft_gpt_image_1_edit(request, app, app_data_root, app_env_configs, storyteller_creds_manager).await,
    ImageEditModel::GptImage1p5 => handle_image_edit_artcraft_via_router(request, app_env_configs, storyteller_creds_manager, CommonImageModel::GptImage1p5, GenerationModel::GptImage1p5).await,
    ImageEditModel::Seedream4 => handle_image_edit_artcraft_via_router(request, app_env_configs, storyteller_creds_manager, CommonImageModel::Seedream4, GenerationModel::Seedream4).await,
    ImageEditModel::Seedream4p5 => handle_image_edit_artcraft_via_router(request, app_env_configs, storyteller_creds_manager, CommonImageModel::Seedream4p5, GenerationModel::Seedream4p5).await,
    ImageEditModel::Seedream5Lite => handle_image_edit_artcraft_via_router(request, app_env_configs, storyteller_creds_manager, CommonImageModel::Seedream5Lite, GenerationModel::Seedream5Lite).await,
    ImageEditModel::QwenEdit2511Angles => handle_image_edit_artcraft_via_router(request, app_env_configs, storyteller_creds_manager, CommonImageModel::QwenEdit2511Angles, GenerationModel::QwenEdit2511Angles).await,
    ImageEditModel::Flux2LoraAngles => handle_image_edit_artcraft_via_router(request, app_env_configs, storyteller_creds_manager, CommonImageModel::Flux2LoraAngles, GenerationModel::Flux2LoraAngles).await,
  }
}
