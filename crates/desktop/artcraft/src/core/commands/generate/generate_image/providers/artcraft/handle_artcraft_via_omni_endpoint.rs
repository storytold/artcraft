use artcraft_api_defs::omni_gen::cost_and_generate_requests::omni_gen_image_cost_and_generate_request::OmniGenImageCostAndGenerateRequest;
use artcraft_client::endpoints::omni_gen::generate::image::omni_gen_image::omni_gen_image_generate;
use enums::common::generation_provider::GenerationProvider;
use enums::tauri::tasks::task_type::TaskType;
use log::{error, info};
use tokens::tokens::media_files::MediaFileToken;
use uuid_utils::uuid::generate_random_uuid;
use artcraft_client::credentials::storyteller_credential_set::StorytellerCredentialSet;
use crate::core::commands::enqueue::generate_error::GenerateError;
use crate::core::commands::enqueue::task_enqueue_success::TaskEnqueueSuccess;
use crate::core::api_adapters::models::image::tauri_image_model_to_enums_model::tauri_image_model_to_enums_model;
use crate::core::api_adapters::models::image::tauri_image_model_to_generation_model::tauri_image_model_to_generation_model;
use crate::core::commands::generate::generate_image::tauri_generate_image_request::TauriGenerateImageRequest;
use crate::core::commands::generate::generate_image::utils::parse_semantic_media_files::SemanticMediaFiles;
use crate::core::state::app_env_configs::app_env_configs::AppEnvConfigs;

pub async fn handle_artcraft_via_omni_endpoint(
  request: &TauriGenerateImageRequest,
  semantic_media_files: &SemanticMediaFiles,
  creds: &StorytellerCredentialSet,
  app_env_configs: &AppEnvConfigs,
) -> Result<TaskEnqueueSuccess, GenerateError> {
  let tauri_model = request.model.ok_or(GenerateError::no_model_specified())?;

  let omni_api_model = tauri_image_model_to_enums_model(tauri_model)
    .ok_or(GenerateError::NotYetImplemented(
      format!("Model {:?} is not supported via the omni endpoint", tauri_model),
    ))?;

  let uuid_idempotency_token = generate_random_uuid();

  let image_media_tokens = get_image_media_tokens(request, semantic_media_files);

  let omni_request = OmniGenImageCostAndGenerateRequest {
    idempotency_token: Some(uuid_idempotency_token),
    model: Some(omni_api_model),
    prompt: request.prompt.clone(),
    image_media_tokens,
    resolution: request.resolution,
    aspect_ratio: request.aspect_ratio,
    quality: request.quality,
    image_batch_count: request.batch_size.map(|n| n as u16),
    adjust_horizontal_angle: request.adjust_horizontal_angle,
    adjust_vertical_angle: request.adjust_vertical_angle,
    adjust_zoom: request.adjust_zoom,
  };

  info!("Sending image generation via omni endpoint: model={:?}", omni_api_model);

  let response = omni_gen_image_generate(
    &app_env_configs.storyteller_host,
    Some(creds),
    omni_request,
  ).await.map_err(|err| {
    error!("Omni image generation failed: {:?}", err);
    GenerateError::from(err)
  })?;

  info!("Omni image generation succeeded: job_token={}", response.inference_job_token.as_str());

  let generation_model = tauri_image_model_to_generation_model(tauri_model);

  Ok(TaskEnqueueSuccess {
    task_type: TaskType::ImageGeneration,
    model: Some(generation_model),
    provider: GenerationProvider::Artcraft,
    provider_job_id: Some(response.inference_job_token.to_string()),
  })
}

fn get_image_media_tokens(
  request: &TauriGenerateImageRequest,
  semantic_media_files: &SemanticMediaFiles,
) -> Option<Vec<MediaFileToken>> {
  let num_images = request.image_media_tokens.as_deref()
      .map(|t| t.len())
      .unwrap_or(0);

  let mut image_media_tokens = Vec::with_capacity(num_images + 2);

  if let Some(canvas_token) = &semantic_media_files.canvas_image_media_token {
    image_media_tokens.push(canvas_token.clone());
  }

  if let Some(scene_token) = &semantic_media_files.scene_image_media_token {
    image_media_tokens.push(scene_token.clone());
  }

  if let Some(media_tokens) = &request.image_media_tokens {
    image_media_tokens.extend(media_tokens.clone());
  }

  if image_media_tokens.is_empty() {
    None
  } else {
    Some(image_media_tokens)
  }
}
