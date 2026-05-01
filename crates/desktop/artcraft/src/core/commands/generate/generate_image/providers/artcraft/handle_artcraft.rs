use log::info;

use crate::core::commands::enqueue::generate_error::GenerateError;
use crate::core::commands::enqueue::task_enqueue_success::TaskEnqueueSuccess;
use crate::core::commands::generate::generate_image::providers::artcraft::handle_artcraft_via_legacy::handle_artcraft_via_legacy;
use crate::core::commands::generate::generate_image::providers::artcraft::handle_artcraft_via_omni_endpoint::handle_artcraft_via_omni_endpoint;
use crate::core::commands::generate::generate_image::tauri_generate_image_request::TauriGenerateImageRequest;
use crate::core::state::app_env_configs::app_env_configs::AppEnvConfigs;
use crate::services::storyteller::state::storyteller_credential_manager::StorytellerCredentialManager;

/// Dispatch an image generation request to Artcraft.
///
/// Tries the omni endpoint first. If the model isn't supported there,
/// falls back to the legacy artcraft_router path.
pub async fn handle_artcraft(
  request: &TauriGenerateImageRequest,
  app_env_configs: &AppEnvConfigs,
  storyteller_creds_manager: &StorytellerCredentialManager,
) -> Result<TaskEnqueueSuccess, GenerateError> {
  // Try the omni endpoint first.
  let omni_result = handle_artcraft_via_omni_endpoint(
    request,
    app_env_configs,
    storyteller_creds_manager,
  ).await;

  match omni_result {
    Ok(success) => Ok(success),
    Err(GenerateError::NotYetImplemented(_)) => {
      // Model not supported by omni endpoint — fall back to legacy.
      info!("Model not supported by omni endpoint, falling back to legacy artcraft_router path.");
      handle_artcraft_via_legacy(
        request,
        app_env_configs,
        storyteller_creds_manager,
      ).await
    }
    Err(err) => Err(err),
  }
}
