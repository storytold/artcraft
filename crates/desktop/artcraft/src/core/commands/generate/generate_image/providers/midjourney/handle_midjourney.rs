use crate::core::api_adapters::models::image::tauri_image_model_to_generation_model::tauri_image_model_to_generation_model;
use crate::core::api_adapters::models::image::tauri_image_model_to_router_model::tauri_image_model_to_router_model;
use crate::core::commands::enqueue::generate_error::{BadInputReason, GenerateError};
use crate::core::commands::enqueue::task_enqueue_success::TaskEnqueueSuccess;
use crate::core::commands::generate::common::router_image_request_to_artcraft_prompt::router_image_request_to_artcraft_prompt;
use crate::core::commands::generate::generate_image::providers::artcraft_router::utils::convert_enums_to_router::convert_aspect_ratio;
use crate::core::commands::generate::generate_image::tauri_generate_image_request::TauriGenerateImageRequest;
use crate::core::commands::generate::generate_image::tauri_image_model::TauriImageModel;
use crate::core::state::app_env_configs::app_env_configs::AppEnvConfigs;
use crate::services::midjourney::state::midjourney_credential_manager::MidjourneyCredentialManager;
use crate::services::storyteller::state::storyteller_credential_manager::StorytellerCredentialManager;
use artcraft_client::endpoints::prompts::create_prompt::create_prompt;
use artcraft_router::api::router_image_model::RouterImageModel;
use artcraft_router::api::router_provider::RouterProvider;
use artcraft_router::client::generation_mode_mismatch_strategy::GenerationModeMismatchStrategy;
use artcraft_router::client::request_mismatch_mitigation_strategy::RequestMismatchMitigationStrategy;
use artcraft_router::client::router_client::RouterClient;
use artcraft_router::client::router_midjourney_client::RouterMidjourneyClient;
use artcraft_router::generate::generate_image::generate_image_request_builder::GenerateImageRequestBuilder;
use artcraft_router::generate::generate_image::generate_image_response::GenerateImageResponse;
use artcraft_router::generate::generate_image::image_generation_draft_or_request::ImageGenerationDraftOrRequest;
use enums::common::generation_provider::GenerationProvider;
use enums::tauri::tasks::task_type::TaskType;

pub async fn handle_midjourney(request: &TauriGenerateImageRequest, config: &AppEnvConfigs, credentials: &MidjourneyCredentialManager, storyteller: &StorytellerCredentialManager) -> Result<TaskEnqueueSuccess, GenerateError> {
  let model = request.model.ok_or_else(GenerateError::no_model_specified)?;
  if !matches!(model, TauriImageModel::Midjourney | TauriImageModel::Midjourney7 | TauriImageModel::Midjourney7Niji | TauriImageModel::Midjourney8) {
    return Err(bad_input("This model cannot use a Midjourney account"));
  }
  if has_image_inputs(request) {
    return Err(bad_input("Direct Midjourney does not support image references yet"));
  }
  if request.batch_size.is_some_and(|count| count != 4) {
    return Err(bad_input("Direct Midjourney generates four images per job"));
  }
  let builder = GenerateImageRequestBuilder { model: tauri_image_model_to_router_model(model).unwrap_or(RouterImageModel::Midjourney8), provider: RouterProvider::Midjourney, prompt: request.prompt.clone(), image_inputs: None, resolution: None, aspect_ratio: request.aspect_ratio.map(convert_aspect_ratio), quality: None, image_batch_count: Some(4), horizontal_angle: None, vertical_angle: None, zoom: None, request_mismatch_mitigation_strategy: RequestMismatchMitigationStrategy::PayMoreUpgrade, generation_mode_mismatch_strategy: Some(GenerationModeMismatchStrategy::AbortGeneration), idempotency_token: None };
  let prompt_request = router_image_request_to_artcraft_prompt(&builder);
  let ImageGenerationDraftOrRequest::Request(generation) = builder.build2()? else {
    return Err(bad_input("Unexpected Midjourney request draft"));
  };
  let session = credentials.session().await.map_err(GenerateError::AnyhowError)?.ok_or_else(GenerateError::needs_midjourney_credentials)?;
  // Persist the prompt before submit and link it to the task. Completion can
  // then attribute results after restart, including websocket-only completions.
  let storyteller_credentials = storyteller.get_credentials().map_err(GenerateError::AnyhowError)?.ok_or_else(GenerateError::needs_storyteller_credentials)?;
  let prompt = create_prompt(&config.storyteller_host, Some(&storyteller_credentials), prompt_request).await?;
  let client = RouterClient::Midjourney(RouterMidjourneyClient::new(session.cookie_header, session.user_id, session.browser));
  let response = generation.send_request(&client).await?;
  let GenerateImageResponse::Midjourney(response) = response else {
    return Err(bad_input("Unexpected Midjourney response"));
  };
  Ok(TaskEnqueueSuccess { task_type: TaskType::ImageGeneration, model: Some(tauri_image_model_to_generation_model(model)), provider: GenerationProvider::Midjourney, provider_job_id: Some(response.job_id), maybe_queue_status_url: None, maybe_queue_response_url: None, maybe_prompt_token: Some(prompt.prompt_token) })
}

fn has_image_inputs(request: &TauriGenerateImageRequest) -> bool {
  request.image_media_tokens.as_ref().is_some_and(|images| !images.is_empty()) || request.canvas_image_media_token.is_some() || request.canvas_image_raw_bytes.is_some() || request.scene_image_media_token.is_some() || request.scene_image_raw_bytes.is_some() || request.inpainting_mask_image_media_token.is_some() || request.inpainting_mask_image_raw_bytes.is_some()
}

fn bad_input(message: &str) -> GenerateError {
  GenerateError::BadInput(BadInputReason::WrongImageArguments(message.to_string()))
}
