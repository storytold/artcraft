use crate::core::commands::deprecated::text_to_image::enqueue_text_to_image_command::EnqueueTextToImageRequest;
use crate::core::commands::enqueue::generate_error::GenerateError;
use crate::core::commands::enqueue::task_enqueue_success::TaskEnqueueSuccess;
use crate::core::commands::generate::generate_image::providers::midjourney::handle_midjourney::handle_midjourney as handle_midjourney_generation;
use crate::core::commands::generate::generate_image::tauri_generate_image_request::TauriGenerateImageRequest;
use crate::core::state::app_env_configs::app_env_configs::AppEnvConfigs;
use crate::services::midjourney::state::midjourney_credential_manager::MidjourneyCredentialManager;
use tauri::{AppHandle, Manager};

pub async fn handle_midjourney(app: &AppHandle, request: &EnqueueTextToImageRequest, config: &AppEnvConfigs, credentials: &MidjourneyCredentialManager) -> Result<TaskEnqueueSuccess, GenerateError> {
  let request: TauriGenerateImageRequest = serde_json::from_value(serde_json::json!({
    "model": "midjourney", "provider": "midjourney", "prompt": request.prompt,
    "aspect_ratio": request.common_aspect_ratio, "batch_size": request.number_images,
    "image_media_tokens": request.image_media_tokens,
  }))
  .map_err(|err| GenerateError::AnyhowError(err.into()))?;
  handle_midjourney_generation(&request, config, credentials, &app.state()).await
}
