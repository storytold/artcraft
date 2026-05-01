use artcraft_api_defs::omni_gen::cost_and_generate_requests::omni_gen_image_cost_and_generate_request::OmniGenImageCostAndGenerateRequest;
use artcraft_client::endpoints::omni_gen::generate::image::omni_gen_image::omni_gen_image_generate;
use enums::common::generation_provider::GenerationProvider;
use enums::tauri::tasks::task_type::TaskType;
use log::{error, info};

use crate::core::commands::enqueue::generate_error::{GenerateError, MissingCredentialsReason};
use crate::core::commands::enqueue::task_enqueue_success::TaskEnqueueSuccess;
use crate::core::commands::generate::generate_image::providers::artcraft::model_mapping::{
  map_to_generation_model, map_to_omni_image_model,
};
use crate::core::commands::generate::generate_image::tauri_generate_image_request::TauriGenerateImageRequest;
use crate::core::state::app_env_configs::app_env_configs::AppEnvConfigs;
use crate::services::storyteller::state::storyteller_credential_manager::StorytellerCredentialManager;

pub async fn handle_artcraft_via_omni_endpoint(
  request: &TauriGenerateImageRequest,
  app_env_configs: &AppEnvConfigs,
  storyteller_creds_manager: &StorytellerCredentialManager,
) -> Result<TaskEnqueueSuccess, GenerateError> {
  let model = request.model.ok_or(GenerateError::no_model_specified())?;

  let omni_model = map_to_omni_image_model(model)
    .ok_or(GenerateError::NotYetImplemented(
      format!("Model {:?} is not supported via the omni endpoint", model),
    ))?;

  let generation_model = map_to_generation_model(model);

  let creds = match storyteller_creds_manager.get_credentials()? {
    Some(creds) => creds,
    None => return Err(GenerateError::MissingCredentials(MissingCredentialsReason::NeedsStorytellerCredentials)),
  };

  // Build image_media_tokens: prepend canvas image if present.
  let mut image_media_tokens = request.image_media_tokens.clone().unwrap_or_default();
  if let Some(canvas_token) = &request.canvas_image_media_token {
    image_media_tokens.insert(0, canvas_token.clone());
  }
  let image_media_tokens = if image_media_tokens.is_empty() { None } else { Some(image_media_tokens) };

  let omni_request = OmniGenImageCostAndGenerateRequest {
    idempotency_token: None,
    model: Some(omni_model),
    prompt: request.prompt.clone(),
    image_media_tokens,
    resolution: None,
    aspect_ratio: None,
    quality: request.quality,
    image_batch_count: request.batch_size.map(|n| n as u16),
    adjust_horizontal_angle: request.adjust_horizontal_angle,
    adjust_vertical_angle: request.adjust_vertical_angle,
    adjust_zoom: request.adjust_zoom,
  };

  info!("Sending image generation via omni endpoint: model={:?}", omni_model);

  let response = omni_gen_image_generate(
    &app_env_configs.storyteller_host,
    Some(&creds),
    omni_request,
  ).await.map_err(|err| {
    error!("Omni image generation failed: {:?}", err);
    GenerateError::from(err)
  })?;

  info!("Omni image generation succeeded: job_token={}", response.inference_job_token.as_str());

  Ok(TaskEnqueueSuccess {
    task_type: TaskType::ImageGeneration,
    model: Some(generation_model),
    provider: GenerationProvider::Artcraft,
    provider_job_id: Some(response.inference_job_token.to_string()),
  })
}
