use log::info;

use crate::core::commands::enqueue::generate_error::{GenerateError, MissingCredentialsReason};
use crate::core::commands::enqueue::task_enqueue_success::TaskEnqueueSuccess;
use crate::core::commands::generate::generate_image::providers::artcraft::handle_artcraft_via_legacy::handle_artcraft_via_legacy;
use crate::core::commands::generate::generate_image::providers::artcraft::handle_artcraft_via_omni_endpoint::handle_artcraft_via_omni_endpoint;
use crate::core::commands::generate::generate_image::tauri_generate_image_request::TauriGenerateImageRequest;
use crate::core::commands::generate::generate_image::tauri_image_model::TauriImageModel;
use crate::core::commands::generate::generate_image::utils::parse_semantic_media_files::parse_semantic_media_files;
use crate::core::state::app_env_configs::app_env_configs::AppEnvConfigs;
use crate::services::storyteller::state::storyteller_credential_manager::StorytellerCredentialManager;


/// Dispatch an image generation request to Artcraft.
pub async fn handle_artcraft(
  request: &TauriGenerateImageRequest,
  app_env_configs: &AppEnvConfigs,
  storyteller_creds_manager: &StorytellerCredentialManager,
) -> Result<TaskEnqueueSuccess, GenerateError> {
  // Resolve credentials.
  let creds = match storyteller_creds_manager.get_credentials()? {
    Some(creds) => creds,
    None => return Err(GenerateError::MissingCredentials(MissingCredentialsReason::NeedsStorytellerCredentials)),
  };

  // Resolve semantic media files (upload raw bytes if provided).
  let semantic_media_files = parse_semantic_media_files(
    request,
    &creds,
    &app_env_configs.storyteller_host,
  ).await?;

  let use_legacy = request.model
      .is_some_and(|m| is_legacy_only_model(m));

  if use_legacy {
    info!("Model {:?} is legacy-only, routing to artcraft_router path.", request.model);
    handle_artcraft_via_legacy(
      request,
      &semantic_media_files,
      &creds,
      app_env_configs,
    ).await
  } else {
    handle_artcraft_via_omni_endpoint(
      request,
      &semantic_media_files,
      &creds,
      app_env_configs,
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
