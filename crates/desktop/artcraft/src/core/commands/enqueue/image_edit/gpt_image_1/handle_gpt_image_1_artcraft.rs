use crate::core::commands::enqueue::image::enqueue_text_to_image_command::EnqueueTextToImageRequest;
use crate::core::commands::enqueue::image::internal_image_error::InternalImageError;
use crate::core::commands::enqueue::image_edit::enqueue_contextual_edit_image_command::{EditImageQuality, EditImageSize, EnqueueContextualEditImageCommand};
use crate::core::commands::enqueue::image_edit::errors::InternalContextualEditImageError;
use crate::core::commands::enqueue::image_edit::gpt_image_1::handle_gpt_image_1::MAX_IMAGES;
use crate::core::commands::enqueue::task_enqueue_success::TaskEnqueueSuccess;
use crate::core::events::basic_sendable_event_trait::BasicSendableEvent;
use crate::core::events::generation_events::common::{GenerationAction, GenerationModel, GenerationServiceProvider};
use crate::core::events::generation_events::generation_enqueue_failure_event::GenerationEnqueueFailureEvent;
use crate::core::model::contextual_image_edit_models::ContextualImageEditModel;
use crate::core::model::image_models::ImageModel;
use crate::core::state::app_env_configs::app_env_configs::AppEnvConfigs;
use crate::core::state::data_dir::app_data_root::AppDataRoot;
use crate::core::state::provider_priority::ProviderPriorityStore;
use crate::services::fal::state::fal_credential_manager::FalCredentialManager;
use crate::services::fal::state::fal_task_queue::FalTaskQueue;
use crate::services::sora::state::sora_credential_manager::SoraCredentialManager;
use crate::services::sora::state::sora_task_queue::SoraTaskQueue;
use crate::services::storyteller::state::storyteller_credential_manager::StorytellerCredentialManager;
use anyhow::anyhow;
use artcraft_api_defs::generate::image::edit::gpt_image_1_edit_image::{GptImage1EditImageImageQuality, GptImage1EditImageImageSize, GptImage1EditImageNumImages, GptImage1EditImageRequest};
use artcraft_api_defs::generate::image::generate_flux_1_dev_text_to_image::GenerateFlux1DevTextToImageRequest;
use artcraft_api_defs::generate::image::generate_flux_1_schnell_text_to_image::GenerateFlux1SchnellTextToImageRequest;
use artcraft_api_defs::generate::image::generate_flux_pro_11_text_to_image::GenerateFluxPro11TextToImageRequest;
use artcraft_api_defs::generate::image::generate_flux_pro_11_ultra_text_to_image::GenerateFluxPro11UltraTextToImageRequest;
use fal_client::requests::queue::image_gen::enqueue_flux_pro_11_ultra_text_to_image::{enqueue_flux_pro_11_ultra_text_to_image, FluxPro11UltraTextToImageArgs};
use fal_client::requests::webhook::image::enqueue_gpt_image_1_edit_image_webhook::GptEditImageQuality;
use idempotency::uuid::generate_random_uuid;
use log::{error, info};
use storyteller_client::generate::image::edit::gpt_image_1_edit_image::gpt_image_1_edit_image;
use storyteller_client::generate::image::generate_flux_1_dev_text_to_image::generate_flux_1_dev_text_to_image;
use storyteller_client::generate::image::generate_flux_1_schnell_text_to_image::generate_flux_1_schnell_text_to_image;
use storyteller_client::generate::image::generate_flux_pro_11_text_to_image::generate_flux_pro_11_text_to_image;
use storyteller_client::generate::image::generate_flux_pro_11_ultra_text_to_image::generate_flux_pro_11_ultra_text_to_image;
use tauri::AppHandle;
use enums::common::generation_provider::GenerationProvider;
use enums::tauri::tasks::task_type::TaskType;

pub async fn handle_gpt_image_1_artcraft(
  request: &EnqueueContextualEditImageCommand,
  app: &AppHandle,
  app_data_root: &AppDataRoot,
  app_env_configs: &AppEnvConfigs,
  storyteller_creds_manager: &StorytellerCredentialManager,
) -> Result<TaskEnqueueSuccess, InternalContextualEditImageError> {

  let creds = match storyteller_creds_manager.get_credentials()? {
    Some(creds) => creds,
    None => {
      return Err(InternalContextualEditImageError::NeedsStorytellerCredentials);
    },
  };

  info!("Calling Artcraft gpt-image-1 ...");

  let uuid_idempotency_token = generate_random_uuid();
  
  let image_quality = request.image_quality
      .map(|quality| match quality {
        EditImageQuality::Auto => GptImage1EditImageImageQuality::Auto,
        EditImageQuality::High => GptImage1EditImageImageQuality::High,
        EditImageQuality::Medium => GptImage1EditImageImageQuality::Medium,
        EditImageQuality::Low => GptImage1EditImageImageQuality::Low,
      });
  
  let image_size = request.aspect_ratio
      .map(|size| match size {
        EditImageSize::Auto => GptImage1EditImageImageSize::Square,
        EditImageSize::Square => GptImage1EditImageImageSize::Square,
        EditImageSize::Tall => GptImage1EditImageImageSize::Vertical,
        EditImageSize::Wide => GptImage1EditImageImageSize::Horizontal,
      });

  let num_images = match request.image_count {
    None => None,
    Some(1) => Some(GptImage1EditImageNumImages::One),
    Some(2) => Some(GptImage1EditImageNumImages::Two),
    Some(3) => Some(GptImage1EditImageNumImages::Three),
    Some(4) => Some(GptImage1EditImageNumImages::Four),
    Some(other) => {
      return Err(InternalContextualEditImageError::InvalidNumberOfRequestedImages {
        min: 1,
        max: 4,
        requested: other,
      });
    },
  };
  
  let mut media_tokens = Vec::with_capacity(10);
  
  if let Some(scene_image_media_token) = request.scene_image_media_token.clone() {
    media_tokens.push(scene_image_media_token);
  }
  
  if let Some(image_media_tokens) = request.image_media_tokens.as_ref() {
    media_tokens.extend_from_slice(image_media_tokens);
  }
  
  if media_tokens.len() > MAX_IMAGES {
    return Err(InternalContextualEditImageError::InvalidNumberOfInputImages { 
      min: 1,
      max: MAX_IMAGES as u32,
      requested: media_tokens.len() as u32,
    });
  }

  let request = GptImage1EditImageRequest {
    uuid_idempotency_token,
    prompt: Some(request.prompt.clone()),
    image_media_tokens: Some(media_tokens),
    image_size,
    num_images,
    image_quality,
  };

  let result = gpt_image_1_edit_image(
    &app_env_configs.storyteller_host,
    Some(&creds),
    request,
  ).await;
  
  let job_id = match result {
    Ok(enqueued) => {
      // TODO(bt,2025-07-05): Enqueue job token?
      info!("Successfully enqueued Artcraft gpt-image-1. Job token: {}", 
        enqueued.inference_job_token);
      enqueued.inference_job_token
    }
    Err(err) => {
      error!("Failed to use Artcraft gpt-image-1: {:?}", err);
      return Err(InternalContextualEditImageError::StorytellerError(err));
    }
  };
  
  Ok(TaskEnqueueSuccess {
    provider: GenerationProvider::Artcraft,
    model: Some(GenerationModel::GptImage1),
    provider_job_id: Some(job_id.to_string()),
    task_type: TaskType::ImageGeneration,
  })
}
