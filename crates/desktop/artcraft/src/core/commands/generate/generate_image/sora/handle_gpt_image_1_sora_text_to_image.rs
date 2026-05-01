use crate::core::api_adapters::aspect_ratio::convert::aspect_ratio_to_grok_image::aspect_ratio_to_grok_image;
use crate::core::api_adapters::aspect_ratio::convert::aspect_ratio_to_sora_native_gpt_image_1::aspect_ratio_to_sora_native_gpt_image_1;
use crate::core::commands::enqueue::generate_error::GenerateError;
use crate::core::commands::enqueue::task_enqueue_success::TaskEnqueueSuccess;
use crate::core::commands::enqueue::text_to_image::enqueue_text_to_image_command::{EnqueueTextToImageRequest, TextToImageSize};
use crate::core::events::basic_sendable_event_trait::BasicSendableEvent;
use crate::core::events::functional_events::show_provider_login_modal_event::ShowProviderLoginModalEvent;
use crate::core::events::generation_events::common::{GenerationAction, GenerationModel, GenerationServiceProvider};
use crate::core::events::generation_events::generation_enqueue_failure_event::GenerationEnqueueFailureEvent;
use crate::services::sora::state::sora_credential_manager::SoraCredentialManager;
use crate::services::sora::state::sora_task_queue::SoraTaskQueue;
use enums::common::generation_provider::GenerationProvider;
use enums::tauri::tasks::task_type::TaskType;
use errors::AnyhowResult;
use grok_client::requests::image_websocket::messages::websocket_client_message::ClientMessageAspectRatio;
use log::{error, info};
use openai_sora_client::recipes::maybe_upgrade_or_renew_session::maybe_upgrade_or_renew_session;
use openai_sora_client::recipes::simple_image_gen_with_session_auto_renew::{simple_image_gen_with_session_auto_renew, SimpleImageGenAutoRenewRequest};
use openai_sora_client::requests::image_gen::common::{ImageSize, NumImages};
use std::time::Duration;
use tauri::AppHandle;

const SORA_SIMPLE_IMAGE_GEN_TIMEOUT : Duration = Duration::from_millis(1000 * 30); // 30 seconds

pub async fn handle_gpt_image_1_sora_text_to_image(
  request: &EnqueueTextToImageRequest,
  app: &AppHandle,
  sora_creds_manager: &SoraCredentialManager,
  sora_task_queue: &SoraTaskQueue,
) -> Result<TaskEnqueueSuccess, GenerateError> {

  let mut creds = match sora_creds_manager.get_credentials() {
    Ok(Some(creds)) => creds,
    Ok(None) => {
      error!("Sora credentials not found.");
      ShowProviderLoginModalEvent::send_for_provider(GenerationProvider::Sora, &app);
      return Err(GenerateError::needs_sora_credentials());
    }
    Err(err) => {
      error!("Error reading Sora credentials: {:?}", err);
      ShowProviderLoginModalEvent::send_for_provider(GenerationProvider::Sora, &app);
      return Err(GenerateError::needs_sora_credentials());
    }
  };

  let credential_updated = maybe_upgrade_or_renew_session(&mut creds)
      .await
      .map_err(|err| {
        error!("Failed to upgrade or renew session: {:?}", err);
        err
      })?;

  if credential_updated {
    info!("Storing updated credentials");
    sora_creds_manager.set_credentials(&creds)?;
  }

  let prompt = request.prompt.as_deref().unwrap_or("");
  
  let aspect_ratio = get_aspect_ratio(request)
      .unwrap_or(ImageSize::Square);

  let num_images = match request.number_images {
    None => NumImages::One,
    Some(1) => NumImages::One,
    Some(2) => NumImages::Two,
    Some(3) => NumImages::Two, // NB: There is no option for three images!
    Some(4) => NumImages::Four,
    _ => NumImages::One,
  };

  let result =
      simple_image_gen_with_session_auto_renew(SimpleImageGenAutoRenewRequest {
        prompt: prompt.to_string(),
        num_images,
        image_size: aspect_ratio,
        credentials: &creds,
        request_timeout: Some(SORA_SIMPLE_IMAGE_GEN_TIMEOUT),
      }).await;

  let (response, maybe_new_creds) = 
      match result {
        Ok((response, maybe_new_creds)) => (response, maybe_new_creds),
        Err(err) => {
          let event = GenerationEnqueueFailureEvent {
            action: GenerationAction::GenerateImage,
            service: GenerationServiceProvider::Sora,
            model: None,
            reason: None,
          };

          if let Err(err) = event.send(app) {
            error!("Failed to emit event: {:?}", err); // Fail open.
          }

          return Err(GenerateError::from(err));
        }
      };

  if let Some(new_creds) = maybe_new_creds {
    info!("Storing updated credentials.");
    sora_creds_manager.set_credentials(&new_creds)?;
  }

  info!("New Sora Task ID: {:?} ", response.task_id);

  sora_task_queue.insert(&response.task_id)?;

  Ok(TaskEnqueueSuccess {
    provider: GenerationProvider::Sora,
    task_type: TaskType::ImageGeneration,
    model: Some(GenerationModel::GptImage1),
    provider_job_id: Some(response.task_id.to_string()),
  })
}

fn get_aspect_ratio(request: &EnqueueTextToImageRequest) -> Option<ImageSize> {
  if let Some(common_aspect_ratio) = request.common_aspect_ratio {
    // Handle modern aspect ratio
    let aspect = aspect_ratio_to_sora_native_gpt_image_1(common_aspect_ratio);
    return Some(aspect);
  }

  if let Some(aspect_ratio) = request.aspect_ratio {
    // Handle deprecated aspect ratio
    return match aspect_ratio {
      TextToImageSize::Auto => Some(ImageSize::Square),
      TextToImageSize::Square => Some(ImageSize::Square),
      TextToImageSize::Wide => Some(ImageSize::Wide),
      TextToImageSize::Tall => Some(ImageSize::Tall),
    }
  }

  None
}
