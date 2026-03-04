use crate::core::commands::enqueue::generate_error::GenerateError;
use crate::core::commands::enqueue::task_enqueue_success::TaskEnqueueSuccess;
use crate::core::commands::enqueue::text_to_image::artcraft::handle_artcraft_gpt_image_1_text_to_image::handle_artcraft_gpt_image_1_text_to_image;
use crate::core::commands::enqueue::text_to_image::artcraft::handle_text_to_image_artcraft_via_router::handle_text_to_image_artcraft_via_router;
use crate::core::commands::enqueue::text_to_image::enqueue_text_to_image_command::{EnqueueTextToImageRequest, TextToImageModel};
use crate::core::commands::enqueue::text_to_image::text_to_image_models::text_to_image_model_to_model_type;
use crate::core::events::generation_events::common::GenerationModel;
use crate::core::state::app_env_configs::app_env_configs::AppEnvConfigs;
use crate::core::state::data_dir::app_data_root::AppDataRoot;
use crate::services::storyteller::state::storyteller_credential_manager::StorytellerCredentialManager;
use artcraft_router::api::common_image_model::CommonImageModel;
use enums::common::generation_provider::GenerationProvider;
use tauri::AppHandle;

pub async fn handle_text_to_image_artcraft(
  model: TextToImageModel,
  request: &EnqueueTextToImageRequest,
  app: &AppHandle,
  app_data_root: &AppDataRoot,
  app_env_configs: &AppEnvConfigs,
  storyteller_creds_manager: &StorytellerCredentialManager,
) -> Result<TaskEnqueueSuccess, GenerateError> {

  match model {
    TextToImageModel::Midjourney | TextToImageModel::GrokImage => {
      Err(GenerateError::BadProviderForModel {
        provider: GenerationProvider::Artcraft,
        model: text_to_image_model_to_model_type(model),
      })
    }
    TextToImageModel::Recraft3 => {
      Err(GenerateError::NotYetImplemented(format!("not yet implemented in Artcraft")))
    }
    TextToImageModel::Flux1Dev => handle_text_to_image_artcraft_via_router(request, app_env_configs, storyteller_creds_manager, CommonImageModel::Flux1Dev, GenerationModel::Flux1Dev).await,
    TextToImageModel::Flux1Schnell => handle_text_to_image_artcraft_via_router(request, app_env_configs, storyteller_creds_manager, CommonImageModel::Flux1Schnell, GenerationModel::Flux1Schnell).await,
    TextToImageModel::FluxPro11 => handle_text_to_image_artcraft_via_router(request, app_env_configs, storyteller_creds_manager, CommonImageModel::FluxPro11, GenerationModel::FluxPro11).await,
    TextToImageModel::FluxPro11Ultra => handle_text_to_image_artcraft_via_router(request, app_env_configs, storyteller_creds_manager, CommonImageModel::FluxPro11Ultra, GenerationModel::FluxPro11Ultra).await,
    TextToImageModel::GptImage1 => handle_artcraft_gpt_image_1_text_to_image(request, app_env_configs, storyteller_creds_manager).await,
    TextToImageModel::GptImage1p5 => handle_text_to_image_artcraft_via_router(request, app_env_configs, storyteller_creds_manager, CommonImageModel::GptImage1p5, GenerationModel::GptImage1p5).await,
    TextToImageModel::Gemini25Flash | TextToImageModel::NanoBanana => {
      handle_text_to_image_artcraft_via_router(request, app_env_configs, storyteller_creds_manager, CommonImageModel::NanaBanana, GenerationModel::NanoBanana).await
    },
    TextToImageModel::NanoBananaPro => handle_text_to_image_artcraft_via_router(request, app_env_configs, storyteller_creds_manager, CommonImageModel::NanaBananaPro, GenerationModel::NanoBananaPro).await,
    TextToImageModel::Seedream4 => handle_text_to_image_artcraft_via_router(request, app_env_configs, storyteller_creds_manager, CommonImageModel::Seedream4, GenerationModel::Seedream4).await,
    TextToImageModel::Seedream4p5 => handle_text_to_image_artcraft_via_router(request, app_env_configs, storyteller_creds_manager, CommonImageModel::Seedream4p5, GenerationModel::Seedream4p5).await,
  }
}
