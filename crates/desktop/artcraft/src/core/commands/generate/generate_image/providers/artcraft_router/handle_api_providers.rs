use artcraft_client::endpoints::prompts::create_prompt::create_prompt;
use artcraft_client::utils::api_host::ApiHost;
use artcraft_router::api::image_list_ref::ImageListRef;
use artcraft_router::api::provider::Provider;
use artcraft_router::client::generation_mode_mismatch_strategy::GenerationModeMismatchStrategy;
use artcraft_router::client::request_mismatch_mitigation_strategy::RequestMismatchMitigationStrategy;
use artcraft_router::client::router_client::RouterClient;
use artcraft_router::client::router_fal_client::RouterFalClient;
use artcraft_router::generate::generate_image::generate_image_request_builder::GenerateImageRequestBuilder;
use artcraft_router::generate::generate_image::generate_image_response::GenerateImageResponse;
use artcraft_router::generate::generate_image_v2::image_generation_draft_or_request::ImageGenerationDraftOrRequest;
use enums::common::generation_provider::GenerationProvider;
use enums::tauri::tasks::task_type::TaskType;
use log::{error, info, warn};
use tokens::tokens::media_files::MediaFileToken;
use tokens::tokens::prompts::PromptToken;

use crate::core::api_adapters::models::image::tauri_image_model_to_generation_model::tauri_image_model_to_generation_model;
use crate::core::api_adapters::models::image::tauri_image_model_to_router_model::tauri_image_model_to_router_model;
use crate::core::commands::enqueue::generate_error::GenerateError;
use crate::core::commands::enqueue::task_enqueue_success::TaskEnqueueSuccess;
use crate::core::commands::generate::common::router_image_request_to_artcraft_prompt::router_image_request_to_artcraft_prompt;
use crate::core::commands::generate::generate_image::providers::artcraft_router::utils::convert_enums_to_router::{convert_aspect_ratio, convert_quality, convert_resolution};
use crate::core::commands::generate::generate_image::providers::artcraft_router::utils::map_media_files_to_urls::map_media_file_tokens_to_cdn_urls;
use crate::core::commands::generate::generate_image::tauri_generate_image_request::TauriGenerateImageRequest;
use crate::core::commands::generate::generate_image::tauri_image_model::TauriImageModel;
use crate::core::state::app_env_configs::app_env_configs::AppEnvConfigs;
use crate::services::storyteller::state::storyteller_credential_manager::StorytellerCredentialManager;

/// Handle image generation for providers that authenticate via API key.
pub async fn handle_api_key_provider(
  request: &TauriGenerateImageRequest,
  provider: GenerationProvider,
  api_key: &str,
  app_env_configs: &AppEnvConfigs,
  storyteller_creds_manager: &StorytellerCredentialManager,
) -> Result<TaskEnqueueSuccess, GenerateError> {
  match provider {
    GenerationProvider::Fal => {
      handle_fal(request, api_key, app_env_configs, storyteller_creds_manager).await
    }
    _ => {
      Err(GenerateError::NotYetImplemented(
        format!("API key provider {:?} is not yet supported via the router path", provider),
      ))
    }
  }
}

// ── FAL ──

async fn handle_fal(
  request: &TauriGenerateImageRequest,
  api_key: &str,
  app_env_configs: &AppEnvConfigs,
  storyteller_creds_manager: &StorytellerCredentialManager,
) -> Result<TaskEnqueueSuccess, GenerateError> {
  let tauri_model = request.model.ok_or(GenerateError::no_model_specified())?;
  let api_host = &app_env_configs.storyteller_host;

  let router_model = tauri_image_model_to_router_model(tauri_model)
    .ok_or(GenerateError::NotYetImplemented(
      format!("Model {:?} is not supported via the FAL router path", tauri_model),
    ))?;

  // Collect all media file tokens that need resolving.
  let image_inputs = resolve_image_inputs(request, api_host).await?;

  let router_request = GenerateImageRequestBuilder {
    model: router_model,
    provider: Provider::Fal,
    prompt: request.prompt.clone(),
    image_inputs,
    resolution: request.resolution.map(convert_resolution),
    aspect_ratio: request.aspect_ratio.map(convert_aspect_ratio),
    quality: request.quality.map(convert_quality),
    image_batch_count: request.batch_size.map(|n| n as u16),
    horizontal_angle: request.adjust_horizontal_angle,
    vertical_angle: request.adjust_vertical_angle,
    zoom: request.adjust_zoom,
    request_mismatch_mitigation_strategy: RequestMismatchMitigationStrategy::PayMoreUpgrade,
    generation_mode_mismatch_strategy: Some(GenerationModeMismatchStrategy::GenerateAnyway),
    idempotency_token: None,
  };

  // Create a prompt record before sending the generation request.
  let maybe_prompt_token = create_prompt_record(
    &router_request,
    api_host,
    storyteller_creds_manager,
  ).await;

  let fal_client = RouterFalClient::new_polling_only_from_raw_key(api_key);
  let client = RouterClient::Fal(fal_client);

  info!("Building FAL image generation plan: model={:?}", router_model);

  let request = match router_request.build2() {
    Ok(ImageGenerationDraftOrRequest::Request(request)) => request,
    Ok(ImageGenerationDraftOrRequest::Draft(draft)) => {
      warn!("Fal is trying to send draft request: {:?}", draft);
      return Err(GenerateError::NotYetImplemented("Fal should not be sending draft requests".to_string()));
    },
    Err(err) => {
      warn!("Could not use FAL: {:?}", err);
      return Err(GenerateError::NotYetImplemented("Error Message: TODO".to_string()));
    }
  };

  info!("Executing FAL image generation. Request: {:?}", request);

  match request.send_request(&client).await {
    Ok(response) => {
      build_task_enqueue_success(tauri_model, response, maybe_prompt_token)
    },
    Err(err) => {
      warn!("Fal image generation failed: {:?}", err);
      Err(err.into())
    }
  }
}

// ── Helpers ──

async fn resolve_image_inputs(
  request: &TauriGenerateImageRequest,
  api_host: &ApiHost,
) -> Result<Option<ImageListRef>, GenerateError> {
  let mut tokens: Vec<MediaFileToken> = Vec::new();

  if let Some(canvas_token) = &request.canvas_image_media_token {
    tokens.push(canvas_token.clone());
  }

  if let Some(scene_token) = &request.scene_image_media_token {
    tokens.push(scene_token.clone());
  }

  if let Some(media_tokens) = &request.image_media_tokens {
    tokens.extend(media_tokens.clone());
  }

  if tokens.is_empty() {
    return Ok(None);
  }

  let urls = map_media_file_tokens_to_cdn_urls(&tokens, api_host).await?;
  Ok(Some(ImageListRef::Urls(urls)))
}

/// Create a prompt record in the Artcraft backend before sending the generation request.
/// Fails open: if prompt creation fails, we log and return None rather than blocking generation.
async fn create_prompt_record(
  router_request: &GenerateImageRequestBuilder,
  api_host: &ApiHost,
  storyteller_creds_manager: &StorytellerCredentialManager,
) -> Option<PromptToken> {
  let creds = match storyteller_creds_manager.get_credentials() {
    Ok(Some(creds)) => creds,
    _ => {
      warn!("[FalRouter] No Storyteller credentials available, skipping prompt creation");
      return None;
    }
  };

  let prompt_request = router_image_request_to_artcraft_prompt(router_request);

  match create_prompt(api_host, Some(&creds), prompt_request).await {
    Ok(response) => {
      info!("[FalRouter] Created prompt: {:?}", response.prompt_token);
      Some(response.prompt_token)
    }
    Err(err) => {
      error!("[FalRouter] Failed to create prompt (continuing anyway): {:?}", err);
      None
    }
  }
}

fn build_task_enqueue_success(
  tauri_model: TauriImageModel,
  response: GenerateImageResponse,
  maybe_prompt_token: Option<PromptToken>,
) -> Result<TaskEnqueueSuccess, GenerateError> {
  let fal_payload = response.get_fal_payload()
    .ok_or(GenerateError::ResponseHadNoJobTokens)?;

  let provider_job_id = fal_payload.request_id
    .or(fal_payload.gateway_request_id)
    .ok_or(GenerateError::ResponseHadNoJobTokens)?;

  let generation_model = tauri_image_model_to_generation_model(tauri_model);

  Ok(TaskEnqueueSuccess {
    task_type: TaskType::ImageGeneration,
    model: Some(generation_model),
    provider: GenerationProvider::Fal,
    provider_job_id: Some(provider_job_id),
    maybe_queue_status_url: fal_payload.maybe_status_url,
    maybe_queue_response_url: fal_payload.maybe_response_url,
    maybe_prompt_token,
  })
}
