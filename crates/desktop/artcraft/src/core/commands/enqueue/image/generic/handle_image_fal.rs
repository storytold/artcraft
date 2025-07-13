use crate::core::commands::enqueue::image::enqueue_text_to_image_command::EnqueueTextToImageRequest;
use crate::core::commands::enqueue::image::internal_image_error::InternalImageError;
use crate::core::commands::enqueue::task_enqueue_success::TaskEnqueueSuccess;
use crate::core::events::basic_sendable_event_trait::BasicSendableEvent;
use crate::core::events::generation_events::common::{GenerationAction, GenerationModel, GenerationServiceProvider};
use crate::core::events::generation_events::generation_enqueue_failure_event::GenerationEnqueueFailureEvent;
use crate::core::model::image_models::ImageModel;
use crate::services::fal::state::fal_credential_manager::FalCredentialManager;
use crate::services::fal::state::fal_task_queue::FalTaskQueue;
use anyhow::anyhow;
use enums::common::generation_provider::GenerationProvider;
use enums::tauri::tasks::task_type::TaskType;
use fal_client::requests::queue::image_gen::enqueue_flux_pro_11_ultra_text_to_image::{enqueue_flux_pro_11_ultra_text_to_image, FluxPro11UltraTextToImageArgs};
use fal_client::requests::queue::image_gen::enqueue_recraft3_text_to_image::{enqueue_recraft3_text_to_image, Recraft3TextToImageArgs};
use log::{error, info};
use tauri::AppHandle;

pub async fn handle_image_fal(
  app: &AppHandle,
  request: EnqueueTextToImageRequest,
  fal_creds_manager: &FalCredentialManager,
  fal_task_queue: &FalTaskQueue,
) -> Result<TaskEnqueueSuccess, InternalImageError> {

  let api_key = match fal_creds_manager.get_key()? {
    Some(key) => key,
    None => {
      error!("No FAL API key is set. Can't perform action.");
      let event =
          GenerationEnqueueFailureEvent::no_fal_api_key(GenerationAction::GenerateImage);

      if let Err(err) = event.send(&app) {
        error!("Failed to emit event: {:?}", err); // Fail open.
      }
      
      return Err(InternalImageError::NeedsFalApiKey);
    },
  };
  
  let api_key = fal_creds_manager.get_key_required()
      .map_err(|err| {
        error!("EnqueueTextToImage FAL api key required: {:?}", err);
        InternalImageError::NeedsFalApiKey
      })?;

  let prompt = request.prompt.as_deref().unwrap_or("");

  let model;
  
  let result = match request.model {
    None => {
      return Err(InternalImageError::NoModelSpecified);
    }
    Some(ImageModel::GptImage1) => {
      return Err(InternalImageError::AnyhowError(anyhow!("wrong logic: fal is handling sora images")));
    }
    Some(
      ImageModel::Flux1Dev | 
      ImageModel::Flux1Schnell | 
      ImageModel::FluxPro11
    ) => {
      return Err(InternalImageError::AnyhowError(anyhow!("not yet implemented: {:?}", request.model)));
    }
    Some(ImageModel::FluxPro11Ultra) => {
      model = GenerationModel::FluxPro11Ultra;
      info!("enqueue Flux Pro 1.1 Ultra text-to-image with prompt: {}", prompt);
      enqueue_flux_pro_11_ultra_text_to_image(FluxPro11UltraTextToImageArgs {
        prompt,
        api_key: &api_key,
      }).await
    }
    Some(ImageModel::Recraft3) => {
      model = GenerationModel::Recraft3;
      info!("enqueue Recraft v3 text-to-image with prompt: {}", prompt);
      enqueue_recraft3_text_to_image(Recraft3TextToImageArgs {
        prompt,
        api_key: &api_key,
      }).await
    }
  };

  let success_result = match result {
    Ok(enqueued) => {
      info!("Successfully enqueued text to image");

      //let event = GenerationEnqueueSuccessEvent {
      //  action: GenerationAction::GenerateImage,
      //  service: GenerationServiceProvider::Fal,
      //  model: None,
      //};

      //if let Err(err) = event.send(app) {
      //  error!("Failed to emit event: {:?}", err); // Fail open.
      //}

      if let Err(err) = fal_task_queue.insert(&enqueued) {
        error!("Failed to enqueue task: {:?}", err);
        return Err(InternalImageError::AnyhowError(anyhow!("Failed to enqueue task: {:?}", err)));
      }
      
      enqueued
    }
    Err(err) => {
      error!("Failed to enqueue text to image: {:?}", err);

      let event = GenerationEnqueueFailureEvent {
        action: GenerationAction::GenerateImage,
        service: GenerationServiceProvider::Fal,
        model: None,
        reason: None,
      };

      if let Err(err) = event.send(app) {
        error!("Failed to emit event: {:?}", err); // Fail open.
      }

      return Err(InternalImageError::FalError(err));
    }
  };

  Ok(TaskEnqueueSuccess {
    provider: GenerationProvider::Fal,
    task_type: TaskType::ImageGeneration,
    model: Some(model),
    provider_job_id: Some(success_result.request_id.to_string()),
  })
}
