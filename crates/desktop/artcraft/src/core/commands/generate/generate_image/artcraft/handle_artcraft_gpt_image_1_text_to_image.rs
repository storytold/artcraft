use crate::core::commands::enqueue::generate_error::GenerateError;
use crate::core::commands::enqueue::image_edit::enqueue_edit_image_command::{EditImageQuality, EditImageSize};
use crate::core::commands::enqueue::task_enqueue_success::TaskEnqueueSuccess;
use crate::core::commands::enqueue::text_to_image::enqueue_text_to_image_command::{EnqueueTextToImageRequest, TextToImageSize};
use crate::core::events::basic_sendable_event_trait::BasicSendableEvent;
use crate::core::events::generation_events::common::{GenerationAction, GenerationModel, GenerationServiceProvider};
use crate::core::events::generation_events::generation_enqueue_failure_event::GenerationEnqueueFailureEvent;
use crate::core::state::app_env_configs::app_env_configs::AppEnvConfigs;
use crate::core::state::data_dir::app_data_root::AppDataRoot;
use crate::core::state::provider_priority::ProviderPriorityStore;
use crate::services::sora::state::sora_credential_manager::SoraCredentialManager;
use crate::services::sora::state::sora_task_queue::SoraTaskQueue;
use crate::services::storyteller::state::storyteller_credential_manager::StorytellerCredentialManager;
use artcraft_api_defs::generate::image::text::generate_gpt_image_1_text_to_image::{GenerateGptImage1TextToImageImageQuality, GenerateGptImage1TextToImageImageSize, GenerateGptImage1TextToImageNumImages, GenerateGptImage1TextToImageRequest};
use enums::common::generation_provider::GenerationProvider;
use enums::tauri::tasks::task_type::TaskType;
use uuid_utils::uuid::generate_random_uuid;
use log::{error, info};
use openai_sora_client::recipes::maybe_upgrade_or_renew_session::maybe_upgrade_or_renew_session;
use openai_sora_client::recipes::simple_image_gen_with_session_auto_renew::{simple_image_gen_with_session_auto_renew, SimpleImageGenAutoRenewRequest};
use openai_sora_client::requests::image_gen::common::{ImageSize, NumImages};
use std::time::Duration;
use artcraft_client::endpoints::generate::image::edit::gpt_image_1_edit_image::gpt_image_1_edit_image;
use artcraft_client::endpoints::generate::image::text::generate_gpt_image_1_text_to_image::generate_gpt_image_1_text_to_image;
use tauri::AppHandle;

pub async fn handle_artcraft_gpt_image_1_text_to_image(
  request: &EnqueueTextToImageRequest,
  app_env_configs: &AppEnvConfigs,
  storyteller_creds_manager: &StorytellerCredentialManager,
) -> Result<TaskEnqueueSuccess, GenerateError> {

  let creds = match storyteller_creds_manager.get_credentials()? {
    Some(creds) => creds,
    None => {
      return Err(GenerateError::needs_storyteller_credentials());
    },
  };

  info!("Calling Artcraft gpt-image-1 ...");

  let uuid_idempotency_token = generate_random_uuid();

  let image_quality = Some(GenerateGptImage1TextToImageImageQuality::High);
  
  //let image_quality = request.image_quality
  //    .map(|quality| match quality {
  //      EditImageQuality::Auto => GenerateGptImage1TextToImageImageQuality::Auto,
  //      EditImageQuality::High => GenerateGptImage1TextToImageImageQuality::High,
  //      EditImageQuality::Medium => GenerateGptImage1TextToImageImageQuality::Medium,
  //      EditImageQuality::Low => GenerateGptImage1TextToImageImageQuality::Low,
  //    });

  let image_size = request.aspect_ratio
      .map(|size| match size {
        TextToImageSize::Auto => GenerateGptImage1TextToImageImageSize::Square,
        TextToImageSize::Square => GenerateGptImage1TextToImageImageSize::Square,
        TextToImageSize::Tall => GenerateGptImage1TextToImageImageSize::Vertical,
        TextToImageSize::Wide => GenerateGptImage1TextToImageImageSize::Horizontal,
      });

  let num_images = match request.number_images {
    None => None,
    Some(1) => Some(GenerateGptImage1TextToImageNumImages::One),
    Some(2) => Some(GenerateGptImage1TextToImageNumImages::Two),
    Some(3) => Some(GenerateGptImage1TextToImageNumImages::Three),
    Some(4) => Some(GenerateGptImage1TextToImageNumImages::Four),
    // TODO: Error
    //Some(other) => {
    //  return Err(InternalImageError::InvalidNumberOfRequestedImages {
    //    min: 1,
    //    max: 4,
    //    requested: other,
    //  });
    //},
    _ => Some(GenerateGptImage1TextToImageNumImages::One), // Default to one image if invalid number
  };

  let request = GenerateGptImage1TextToImageRequest {
    uuid_idempotency_token,
    prompt: request.prompt.clone(),
    image_size,
    num_images,
    image_quality,
  };

  let result = generate_gpt_image_1_text_to_image(
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
      return Err(GenerateError::from(err));
    }
  };

  Ok(TaskEnqueueSuccess {
    provider: GenerationProvider::Artcraft,
    model: Some(GenerationModel::GptImage1),
    provider_job_id: Some(job_id.to_string()),
    task_type: TaskType::ImageGeneration,
  })
}
