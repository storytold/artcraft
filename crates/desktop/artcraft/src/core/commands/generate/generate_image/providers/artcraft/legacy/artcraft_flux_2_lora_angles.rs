use log::{error, info};

use artcraft_client::credentials::storyteller_credential_set::StorytellerCredentialSet;
use artcraft_router::api::common_image_model::CommonImageModel;
use artcraft_router::api::image_list_ref::ImageListRef;
use artcraft_router::api::provider::Provider;
use artcraft_router::client::request_mismatch_mitigation_strategy::RequestMismatchMitigationStrategy;
use artcraft_router::client::router_artcraft_client::RouterArtcraftClient;
use artcraft_router::client::router_client::RouterClient;
use artcraft_router::generate::generate_image::generate_image_request_builder::GenerateImageRequestBuilder;
use artcraft_router::generate::generate_image_v2::image_generation_draft_or_request::ImageGenerationDraftOrRequest;
use enums::common::generation_provider::GenerationProvider;
use enums::tauri::tasks::task_type::TaskType;

use crate::core::commands::enqueue::generate_error::GenerateError;
use crate::core::commands::enqueue::task_enqueue_success::TaskEnqueueSuccess;
use crate::core::commands::generate::generate_image::tauri_generate_image_request::TauriGenerateImageRequest;
use crate::core::commands::generate::generate_image::utils::parse_semantic_media_files::SemanticMediaFiles;
use crate::core::events::generation_events::common::GenerationModel;
use crate::core::state::app_env_configs::app_env_configs::AppEnvConfigs;

/// Handle Flux2LoraAngles image editing via the artcraft_router.
pub async fn handle_flux_2_lora_angles(
  request: &TauriGenerateImageRequest,
  semantic_media_files: &SemanticMediaFiles,
  creds: &StorytellerCredentialSet,
  app_env_configs: &AppEnvConfigs,
) -> Result<TaskEnqueueSuccess, GenerateError> {
  let client = RouterClient::Artcraft(RouterArtcraftClient::new(
    app_env_configs.storyteller_host.clone(),
    creds.clone(),
  ));

  let image_inputs = build_image_inputs(request, semantic_media_files);

  let router_request = GenerateImageRequestBuilder {
    model: CommonImageModel::Flux2LoraAngles,
    provider: Provider::Artcraft,
    prompt: request.prompt.clone(),
    image_inputs,
    resolution: None,
    aspect_ratio: None,
    quality: None,
    image_batch_count: request.batch_size.map(|n| n as u16),
    request_mismatch_mitigation_strategy: RequestMismatchMitigationStrategy::PayMoreUpgrade,
    generation_mode_mismatch_strategy: None,
    idempotency_token: None,
    horizontal_angle: request.adjust_horizontal_angle,
    vertical_angle: request.adjust_vertical_angle,
    zoom: request.adjust_zoom,
  };

  let dor = router_request.build2()?;

  info!("Flux2LoraAngles request: {:?}", dor);

  let request = match dor {
    ImageGenerationDraftOrRequest::Request(req) => req,
    // Artcraft-side angle models always return a Request — never a Draft.
    ImageGenerationDraftOrRequest::Draft(d) => match d {},
  };

  let response = request.send_request(&client).await.map_err(|err| {
    error!("Flux2LoraAngles generation failed: {:?}", err);
    GenerateError::from(err)
  })?;

  let job_id = response
    .get_artcraft_payload()
    .map(|p| p.inference_job_token.to_string())
    .ok_or(GenerateError::ResponseHadNoJobTokens)?;

  info!("Flux2LoraAngles succeeded: job_id={}", job_id);

  Ok(TaskEnqueueSuccess {
    task_type: TaskType::ImageGeneration,
    model: Some(GenerationModel::Flux2LoraAngles),
    provider: GenerationProvider::Artcraft,
    provider_job_id: Some(job_id),
    maybe_queue_status_url: None,
    maybe_prompt_token: None,
    maybe_queue_response_url: None,
  })
}

fn build_image_inputs(
  request: &TauriGenerateImageRequest,
  semantic_media_files: &SemanticMediaFiles,
) -> Option<ImageListRef> {
  let mut tokens = Vec::new();

  if let Some(scene_token) = &semantic_media_files.scene_image_media_token {
    tokens.push(scene_token.clone());
  }
  if let Some(canvas_token) = &semantic_media_files.canvas_image_media_token {
    tokens.push(canvas_token.clone());
  }
  if let Some(media_tokens) = &request.image_media_tokens {
    tokens.extend(media_tokens.clone());
  }

  if tokens.is_empty() { None } else { Some(ImageListRef::MediaFileTokens(tokens)) }
}
