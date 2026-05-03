use artcraft_router::api::common_image_model::CommonImageModel;
use artcraft_router::api::image_list_ref::ImageListRef;
use artcraft_router::api::provider::Provider;
use artcraft_router::client::request_mismatch_mitigation_strategy::RequestMismatchMitigationStrategy;
use artcraft_router::client::router_artcraft_client::RouterArtcraftClient;
use artcraft_router::client::router_client::RouterClient;
use artcraft_router::generate::generate_image::generate_image_request::GenerateImageRequest;
use enums::common::generation_provider::GenerationProvider;
use enums::tauri::tasks::task_type::TaskType;
use log::{error, info};

use artcraft_client::credentials::storyteller_credential_set::StorytellerCredentialSet;
use crate::core::commands::enqueue::generate_error::GenerateError;
use crate::core::commands::enqueue::task_enqueue_success::TaskEnqueueSuccess;
use crate::core::api_adapters::models::image::tauri_image_model_to_generation_model::tauri_image_model_to_generation_model;
use crate::core::api_adapters::models::image::tauri_image_model_to_router_model::tauri_image_model_to_router_model;
use crate::core::commands::generate::generate_image::tauri_generate_image_request::TauriGenerateImageRequest;
use crate::core::commands::generate::generate_image::utils::parse_semantic_media_files::SemanticMediaFiles;
use crate::core::state::app_env_configs::app_env_configs::AppEnvConfigs;

/// Handle image generation via the legacy artcraft_router path.
///
/// This is used for models not yet supported by the omni endpoint
/// (eg. Recraft, FluxProKontextMax, edit/inpaint models).
pub async fn handle_artcraft_via_legacy(
  request: &TauriGenerateImageRequest,
  _semantic_media_files: &SemanticMediaFiles,
  creds: &StorytellerCredentialSet,
  app_env_configs: &AppEnvConfigs,
) -> Result<TaskEnqueueSuccess, GenerateError> {
  let model = request.model.ok_or(GenerateError::no_model_specified())?;

  let router_model = tauri_image_model_to_router_model(model)
    .ok_or(GenerateError::NotYetImplemented(
      format!("Model {:?} is not supported via the legacy router path", model),
    ))?;

  let generation_model = tauri_image_model_to_generation_model(model);

  let client = RouterClient::Artcraft(RouterArtcraftClient::new(
    app_env_configs.storyteller_host.clone(),
    creds.clone(),
  ));

  // Build image inputs: prepend canvas image if present.
  let mut image_tokens = request.image_media_tokens.clone().unwrap_or_default();
  if let Some(canvas_token) = &request.canvas_image_media_token {
    image_tokens.insert(0, canvas_token.clone());
  }
  let image_inputs = if image_tokens.is_empty() { None } else { Some(ImageListRef::MediaFileTokens(image_tokens)) };

  let router_request = GenerateImageRequest {
    model: router_model,
    provider: Provider::Artcraft,
    prompt: request.prompt.clone(),
    image_inputs,
    resolution: None, // TODO: Convert from request.resolution
    aspect_ratio: None, // TODO: Convert from request.aspect_ratio
    quality: None, // TODO: Convert from request.quality
    image_batch_count: request.batch_size.map(|n| n as u16),
    request_mismatch_mitigation_strategy: RequestMismatchMitigationStrategy::PayMoreUpgrade,
    generation_mode_mismatch_strategy: None,
    idempotency_token: None,
    horizontal_angle: request.adjust_horizontal_angle,
    vertical_angle: request.adjust_vertical_angle,
    zoom: request.adjust_zoom,
  };

  let plan = router_request.build()?;

  info!("Legacy image generation plan: {:?}", plan);

  let response = plan.generate_image(&client).await.map_err(|err| {
    error!("Legacy image generation failed: {:?}", err);
    GenerateError::from(err)
  })?;

  let job_id = response
    .get_artcraft_payload()
    .map(|p| p.inference_job_token.to_string())
    .ok_or(GenerateError::ResponseHadNoJobTokens)?;

  info!("Legacy image generation succeeded: job_id={}", job_id);

  Ok(TaskEnqueueSuccess {
    task_type: TaskType::ImageGeneration,
    model: Some(generation_model),
    provider: GenerationProvider::Artcraft,
    provider_job_id: Some(job_id),
  })
}
