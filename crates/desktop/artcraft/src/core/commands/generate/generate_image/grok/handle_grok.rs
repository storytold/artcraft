use crate::core::api_adapters::aspect_ratio::convert::aspect_ratio_to_grok_image::aspect_ratio_to_grok_image;
use crate::core::commands::enqueue::generate_error::GenerateError;
use crate::core::commands::enqueue::task_enqueue_success::TaskEnqueueSuccess;
use crate::core::commands::enqueue::text_to_image::enqueue_text_to_image_command::{EnqueueTextToImageRequest, TextToImageSize};
use crate::core::events::generation_events::common::GenerationModel;
use crate::core::state::app_env_configs::app_env_configs::AppEnvConfigs;
use crate::services::grok::state::grok_credential_manager::GrokCredentialManager;
use crate::services::grok::state::grok_image_prompt_queue::{GrokImagePromptQueue, PromptItem};
use enums::common::generation_provider::GenerationProvider;
use enums::tauri::tasks::task_type::TaskType;
use grok_client::requests::image_websocket::messages::websocket_client_message::ClientMessageAspectRatio;
use uuid_utils::uuid::generate_random_uuid;
use tauri::AppHandle;

pub async fn handle_grok(
  app: &AppHandle,
  request: &EnqueueTextToImageRequest,
  app_env_configs: &AppEnvConfigs,
  creds_manager: &GrokCredentialManager,
  grok_image_prompt_queue: &GrokImagePromptQueue,
) -> Result<TaskEnqueueSuccess, GenerateError> {


  //// TODO: We can request population of the user info if absent or expired.
  //let websocket = get_websocket(
  //  app,
  //  creds_manager,
  //  websocket_manager,
  //).await?;
  //
  //let _result = prompt_websocket_image(PromptWebsocketImageArgs {
  //  websocket_wrapped: &websocket,
  //  prompt: request.prompt.as_deref().unwrap_or_else(||""),
  //}).await?;
  //
  //let request_id = listen_for_websocket_request_id(ListenForWebsocketRequestIdArgs {
  //  websocket: &websocket,
  //  timeout: Duration::from_millis(10_000),
  //}).await?;
  //
  //let request_id = match request_id.request_id {
  //  Some(request_id) => request_id.to_string(),
  //  None => {
  //    warn!("No request id from Grok image generation (websocket)");
  //    return Err(GenerateError::ProviderFailure(ProviderFailureReason::GrokJobEnqueueFailed));
  //  }
  //};
  //
  //info!("Successfully enqueued MidJourney. Job token: {}", request_id);

  let job_id = generate_random_uuid();

  let prompt = request.prompt
      .as_deref()
      .map(|prompt| prompt.trim().to_string())
      .unwrap_or_else(|| "".to_string());

  let aspect_ratio = get_aspect_ratio(request);

  grok_image_prompt_queue.enqueue(PromptItem {
    task_id: job_id.clone(),
    prompt,
    aspect_ratio: aspect_ratio.unwrap_or(ClientMessageAspectRatio::Square),
  })?;

  Ok(TaskEnqueueSuccess {
    provider: GenerationProvider::Grok,
    model: Some(GenerationModel::GrokImage),
    provider_job_id: Some(job_id),
    task_type: TaskType::ImageGeneration,
  })
}

fn get_aspect_ratio(request: &EnqueueTextToImageRequest) -> Option<ClientMessageAspectRatio> {
  if let Some(common_aspect_ratio) = request.common_aspect_ratio {
    // Handle modern aspect ratio
    let aspect = aspect_ratio_to_grok_image(common_aspect_ratio);
    return Some(aspect);
  }

  if let Some(aspect_ratio) = request.aspect_ratio {
    // Handle deprecated aspect ratio
    return match aspect_ratio {
      TextToImageSize::Auto => Some(ClientMessageAspectRatio::Square),
      TextToImageSize::Square => Some(ClientMessageAspectRatio::Square),
      TextToImageSize::Wide => Some(ClientMessageAspectRatio::WideThreeByTwo),
      TextToImageSize::Tall => Some(ClientMessageAspectRatio::TallTwoByThree),
    }
  }

  None
}
