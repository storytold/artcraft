use log::info;

use crate::core::commands::enqueue::generate_error::GenerateError;
use crate::core::commands::enqueue::task_enqueue_success::TaskEnqueueSuccess;
use crate::core::commands::generate::generate_image::providers::artcraft::handle_artcraft_via_legacy::handle_artcraft_via_legacy;
use crate::core::commands::generate::generate_image::providers::artcraft::handle_artcraft_via_omni_endpoint::handle_artcraft_via_omni_endpoint;
use crate::core::commands::generate::generate_image::tauri_generate_image_request::TauriGenerateImageRequest;
use crate::core::commands::generate::generate_image::tauri_image_model::TauriImageModel;
use crate::core::state::app_env_configs::app_env_configs::AppEnvConfigs;
use crate::services::storyteller::state::storyteller_credential_manager::StorytellerCredentialManager;

/// Dispatch an image generation request to Artcraft.
pub async fn handle_artcraft(
  request: &TauriGenerateImageRequest,
  app_env_configs: &AppEnvConfigs,
  storyteller_creds_manager: &StorytellerCredentialManager,
) -> Result<TaskEnqueueSuccess, GenerateError> {
  let use_legacy = request.model
      .is_some_and(|m| is_legacy_only_model(m));

  if use_legacy {
    info!("Model {:?} is legacy-only, routing to artcraft_router path.", request.model);
    handle_artcraft_via_legacy(
      request,
      app_env_configs,
      storyteller_creds_manager,
    ).await
  } else {
    handle_artcraft_via_omni_endpoint(
      request,
      app_env_configs,
      storyteller_creds_manager,
    ).await
  }
}

fn is_legacy_only_model(model: TauriImageModel) -> bool {
  matches!(
    model,
    TauriImageModel::GrokImage
      | TauriImageModel::Recraft3
      | TauriImageModel::Midjourney
      | TauriImageModel::FluxProKontextMax
      | TauriImageModel::QwenEdit2511Angles
      | TauriImageModel::Flux2LoraAngles
      | TauriImageModel::FluxDevJuggernaut
  )
}
