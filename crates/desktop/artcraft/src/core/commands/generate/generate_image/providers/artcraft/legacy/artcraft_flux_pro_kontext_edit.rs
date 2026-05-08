use log::{error, info};

use artcraft_api_defs::generate::image::edit::flux_pro_kontext_max_edit_image::{
  FluxProKontextMaxEditImageNumImages, FluxProKontextMaxEditImageRequest,
};
use artcraft_client::credentials::storyteller_credential_set::StorytellerCredentialSet;
use artcraft_client::endpoints::generate::image::edit::flux_pro_kontext_max_edit_image::flux_pro_kontext_max_edit_image;
use enums::common::generation_provider::GenerationProvider;
use enums::tauri::tasks::task_type::TaskType;
use tokens::tokens::media_files::MediaFileToken;
use uuid_utils::uuid::generate_random_uuid;

use crate::core::commands::enqueue::generate_error::{BadInputReason, GenerateError};
use crate::core::commands::enqueue::task_enqueue_success::TaskEnqueueSuccess;
use crate::core::commands::generate::generate_image::tauri_generate_image_request::TauriGenerateImageRequest;
use crate::core::commands::generate::generate_image::utils::parse_semantic_media_files::SemanticMediaFiles;
use crate::core::events::generation_events::common::GenerationModel;
use crate::core::state::app_env_configs::app_env_configs::AppEnvConfigs;

/// Handle FluxProKontextMax image editing via the legacy dedicated endpoint.
///
/// Consolidates both the "edit" and "inpaint" legacy paths — both call the same
/// Kontext Max edit endpoint with a single source image.
pub async fn handle_flux_pro_kontext_edit(
  request: &TauriGenerateImageRequest,
  semantic_media_files: &SemanticMediaFiles,
  creds: &StorytellerCredentialSet,
  app_env_configs: &AppEnvConfigs,
) -> Result<TaskEnqueueSuccess, GenerateError> {
  let image_media_token = get_first_image_token(request, semantic_media_files)
    .ok_or(GenerateError::BadInput(BadInputReason::WrongImageArguments(
      "No input image specified for Flux Kontext Max edit".to_string(),
    )))?;

  let num_images = match request.batch_size {
    None => None,
    Some(1) => Some(FluxProKontextMaxEditImageNumImages::One),
    Some(2) => Some(FluxProKontextMaxEditImageNumImages::Two),
    Some(3) => Some(FluxProKontextMaxEditImageNumImages::Three),
    Some(4) => Some(FluxProKontextMaxEditImageNumImages::Four),
    Some(other) => {
      return Err(GenerateError::BadInput(BadInputReason::InvalidNumberOfRequestedImages {
        min: 1,
        max: 4,
        requested: other,
      }));
    }
  };

  let uuid_idempotency_token = generate_random_uuid();

  let kontext_request = FluxProKontextMaxEditImageRequest {
    uuid_idempotency_token,
    prompt: request.prompt.clone(),
    image_media_token,
    num_images,
  };

  info!("Calling FluxProKontextMax edit...");

  let response = flux_pro_kontext_max_edit_image(
    &app_env_configs.storyteller_host,
    Some(creds),
    kontext_request,
  ).await.map_err(|err| {
    error!("FluxProKontextMax edit failed: {:?}", err);
    GenerateError::from(err)
  })?;

  info!("FluxProKontextMax edit succeeded: job_token={}", response.inference_job_token);

  Ok(TaskEnqueueSuccess {
    task_type: TaskType::ImageGeneration,
    model: Some(GenerationModel::FluxProKontextMax),
    provider: GenerationProvider::Artcraft,
    provider_job_id: Some(response.inference_job_token.to_string()),
  })
}

fn get_first_image_token(
  request: &TauriGenerateImageRequest,
  semantic_media_files: &SemanticMediaFiles,
) -> Option<MediaFileToken> {
  if let Some(scene_token) = &semantic_media_files.scene_image_media_token {
    return Some(scene_token.clone());
  }
  if let Some(canvas_token) = &semantic_media_files.canvas_image_media_token {
    return Some(canvas_token.clone());
  }
  if let Some(media_tokens) = &request.image_media_tokens {
    if let Some(token) = media_tokens.first() {
      return Some(token.clone());
    }
  }
  None
}
