use crate::core::commands::enqueue::image::enqueue_text_to_image_command::EnqueueTextToImageRequest;
use crate::core::commands::enqueue::image::internal_image_error::InternalImageError;
use crate::core::commands::enqueue::task_enqueue_success::TaskEnqueueSuccess;
use crate::core::events::basic_sendable_event_trait::BasicSendableEvent;
use crate::core::events::generation_events::common::{GenerationAction, GenerationModel, GenerationServiceProvider};
use crate::core::events::generation_events::generation_enqueue_failure_event::GenerationEnqueueFailureEvent;
use crate::core::model::image_models::ImageModel;
use crate::services::sora::state::sora_credential_manager::SoraCredentialManager;
use crate::services::sora::state::sora_task_queue::SoraTaskQueue;
use enums::common::generation_provider::GenerationProvider;
use enums::tauri::tasks::task_type::TaskType;
use fal_client::requests::queue::image_gen::enqueue_flux_pro_11_ultra_text_to_image::{enqueue_flux_pro_11_ultra_text_to_image, FluxPro11UltraTextToImageArgs};
use log::{error, info};
use openai_sora_client::recipes::maybe_upgrade_or_renew_session::maybe_upgrade_or_renew_session;
use openai_sora_client::recipes::simple_image_gen_with_session_auto_renew::{simple_image_gen_with_session_auto_renew, SimpleImageGenAutoRenewRequest};
use openai_sora_client::requests::image_gen::common::{ImageSize, NumImages};
use std::time::Duration;
use tauri::AppHandle;

const SORA_SIMPLE_IMAGE_GEN_TIMEOUT : Duration = Duration::from_millis(1000 * 30); // 30 seconds

pub async fn handle_image_sora(
  app: &AppHandle,
  request: EnqueueTextToImageRequest,
  sora_creds_manager: &SoraCredentialManager,
  sora_task_queue: &SoraTaskQueue,
) -> Result<TaskEnqueueSuccess, InternalImageError> {

  let mut creds = sora_creds_manager
      .get_credentials_required()
      .map_err(|err| {
        error!("EnqueueTextToImage Sora creds required: {:?}", err);
        InternalImageError::NeedsFalApiKey
      })?;

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

  let result =
      simple_image_gen_with_session_auto_renew(SimpleImageGenAutoRenewRequest {
        prompt: prompt.to_string(),
        num_images: NumImages::One,
        image_size: ImageSize::Square,
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

          return Err(InternalImageError::SoraError(err));
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
