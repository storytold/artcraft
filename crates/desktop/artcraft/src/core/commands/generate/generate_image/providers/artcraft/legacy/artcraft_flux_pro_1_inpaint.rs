use log::{error, info};

use artcraft_api_defs::generate::image::inpaint::flux_pro_1_inpaint_image::{
  FluxPro1InpaintImageNumImages, FluxPro1InpaintImageRequest,
};
use artcraft_client::credentials::storyteller_credential_set::StorytellerCredentialSet;
use artcraft_client::endpoints::generate::image::inpaint::flux_pro_1_inpaint_image::flux_pro_1_inpaint_image;
use enums::common::generation_provider::GenerationProvider;
use enums::tauri::tasks::task_type::TaskType;
use uuid_utils::uuid::generate_random_uuid;

use crate::core::commands::enqueue::generate_error::{BadInputReason, GenerateError};
use crate::core::commands::enqueue::task_enqueue_success::TaskEnqueueSuccess;
use crate::core::commands::generate::generate_image::providers::artcraft::legacy::artcraft_flux_dev_juggernaut_inpaint::get_first_image_token;
use crate::core::commands::generate::generate_image::tauri_generate_image_request::TauriGenerateImageRequest;
use crate::core::commands::generate::generate_image::utils::parse_semantic_media_files::SemanticMediaFiles;
use crate::core::events::generation_events::common::GenerationModel;
use crate::core::state::app_env_configs::app_env_configs::AppEnvConfigs;

/// Handle Flux Pro (Inpainting) via its dedicated endpoint.
///
/// FIX: "Flux Pro 1" is the inpainting model, but it used to be sent to the omni endpoint as Flux Pro 1.1, a
/// text-to-image model, together with the mask. The server answered 500 and the user saw nothing happen.
///
/// Requires a source image (from scene, canvas, or image_media_tokens) and an inpainting mask.
pub async fn handle_flux_pro_1_inpaint(
  request: &TauriGenerateImageRequest,
  semantic_media_files: &SemanticMediaFiles,
  creds: &StorytellerCredentialSet,
  app_env_configs: &AppEnvConfigs,
) -> Result<TaskEnqueueSuccess, GenerateError> {
  let image_media_token = get_first_image_token(request, semantic_media_files)
    .ok_or(GenerateError::required_source_image_not_provided())?;

  let mask_media_token = semantic_media_files.inpainting_mask_image_media_token.clone()
    .ok_or(GenerateError::required_source_image_mask_not_provided())?;

  let num_images = match request.batch_size {
    None => None,
    Some(1) => Some(FluxPro1InpaintImageNumImages::One),
    Some(2) => Some(FluxPro1InpaintImageNumImages::Two),
    Some(3) => Some(FluxPro1InpaintImageNumImages::Three),
    Some(4) => Some(FluxPro1InpaintImageNumImages::Four),
    Some(other) => {
      return Err(GenerateError::BadInput(BadInputReason::InvalidNumberOfRequestedImages {
        min: 1,
        max: 4,
        requested: other,
      }));
    }
  };

  let uuid_idempotency_token = generate_random_uuid();

  let inpaint_request = FluxPro1InpaintImageRequest {
    uuid_idempotency_token,
    prompt: request.prompt.clone(),
    image_media_token,
    mask_media_token,
    num_images,
  };

  info!("Calling FluxPro1 inpaint...");

  let response = flux_pro_1_inpaint_image(
    &app_env_configs.storyteller_host,
    Some(creds),
    inpaint_request,
  ).await.map_err(|err| {
    error!("FluxPro1 inpaint failed: {:?}", err);
    GenerateError::from(err)
  })?;

  info!("FluxPro1 inpaint succeeded: job_token={}", response.inference_job_token);

  Ok(TaskEnqueueSuccess {
    task_type: TaskType::ImageInpaintEdit,
    model: Some(GenerationModel::FluxPro1),
    provider: GenerationProvider::Artcraft,
    provider_job_id: Some(response.inference_job_token.to_string()),
    maybe_queue_status_url: None,
    maybe_prompt_token: None,
    maybe_queue_response_url: None,
  })
}
