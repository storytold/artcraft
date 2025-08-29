use crate::core::commands::enqueue::image_edit::enqueue_contextual_edit_image_command::{EditImageQuality, EditImageSize};
use crate::core::commands::enqueue::image_edit::errors::InternalContextualEditImageError;
use crate::core::commands::enqueue::image_inpaint::errors::InternalImageInpaintError;
use crate::core::commands::enqueue::task_enqueue_success::TaskEnqueueSuccess;
use crate::core::commands::enqueue::text_to_image::enqueue_text_to_image_command::{EnqueueTextToImageRequest, TextToImageSize};
use crate::core::commands::enqueue::text_to_image::internal_image_error::InternalImageError;
use crate::core::events::basic_sendable_event_trait::BasicSendableEvent;
use crate::core::events::generation_events::common::{GenerationAction, GenerationModel, GenerationServiceProvider};
use crate::core::events::generation_events::generation_enqueue_failure_event::GenerationEnqueueFailureEvent;
use crate::core::state::app_env_configs::app_env_configs::AppEnvConfigs;
use crate::core::state::data_dir::app_data_root::AppDataRoot;
use crate::core::state::provider_priority::ProviderPriorityStore;
use crate::services::sora::state::sora_credential_manager::SoraCredentialManager;
use crate::services::sora::state::sora_task_queue::SoraTaskQueue;
use crate::services::storyteller::state::storyteller_credential_manager::StorytellerCredentialManager;
use artcraft_api_defs::generate::image::edit::gemini_25_flash_edit_image::{Gemini25FlashEditImageNumImages, Gemini25FlashEditImageRequest};
use artcraft_api_defs::generate::image::generate_gpt_image_1_text_to_image::{GenerateGptImage1TextToImageImageQuality, GenerateGptImage1TextToImageImageSize, GenerateGptImage1TextToImageNumImages, GenerateGptImage1TextToImageRequest};
use enums::common::generation_provider::GenerationProvider;
use enums::tauri::tasks::task_type::TaskType;
use fal_client::requests::queue::image_gen::enqueue_flux_pro_11_ultra_text_to_image::{enqueue_flux_pro_11_ultra_text_to_image, FluxPro11UltraTextToImageArgs};
use idempotency::uuid::generate_random_uuid;
use log::{error, info};
use openai_sora_client::recipes::maybe_upgrade_or_renew_session::maybe_upgrade_or_renew_session;
use openai_sora_client::recipes::simple_image_gen_with_session_auto_renew::{simple_image_gen_with_session_auto_renew, SimpleImageGenAutoRenewRequest};
use openai_sora_client::requests::image_gen::common::{ImageSize, NumImages};
use std::time::Duration;
use storyteller_client::generate::image::edit::gemini_25_flash_edit_image::gemini_25_flash_edit_image;
use storyteller_client::generate::image::edit::gpt_image_1_edit_image::gpt_image_1_edit_image;
use storyteller_client::generate::image::generate_gpt_image_1_text_to_image::generate_gpt_image_1_text_to_image;
use tauri::AppHandle;

pub async fn handle_gemini_25_flash_artcraft(
  request: &EnqueueTextToImageRequest,
  app_env_configs: &AppEnvConfigs,
  storyteller_creds_manager: &StorytellerCredentialManager,
) -> Result<TaskEnqueueSuccess, InternalImageError> {

  let creds = match storyteller_creds_manager.get_credentials()? {
    Some(creds) => creds,
    None => {
      return Err(InternalImageError::NeedsStorytellerCredentials);
    },
  };

  info!("Calling Artcraft gemini 2.5 flash ...");

  let uuid_idempotency_token = generate_random_uuid();

  let num_images = match request.number_images{
    None => None,
    Some(1) => Some(Gemini25FlashEditImageNumImages::One),
    Some(2) => Some(Gemini25FlashEditImageNumImages::Two),
    Some(3) => Some(Gemini25FlashEditImageNumImages::Three),
    Some(4) => Some(Gemini25FlashEditImageNumImages::Four),
    _ => Some(Gemini25FlashEditImageNumImages::One), // Default to one image if invalid number
  };

  let request = Gemini25FlashEditImageRequest {
    uuid_idempotency_token,
    prompt: request.prompt.clone(),
    image_media_tokens: request.image_media_tokens.clone(),
    num_images,
    image_quality: None,
  };

  let result = gemini_25_flash_edit_image(
    &app_env_configs.storyteller_host,
    Some(&creds),
    request,
  ).await;

  let job_id = match result {
    Ok(enqueued) => {
      // TODO(bt,2025-07-05): Enqueue job token?
      info!("Successfully enqueued Artcraft gemini 2.5 flash. Job token: {}",
        enqueued.inference_job_token);
      enqueued.inference_job_token
    }
    Err(err) => {
      error!("Failed to use Artcraft gemini 2.5 flash: {:?}", err);
      return Err(InternalImageError::StorytellerError(err));
    }
  };

  Ok(TaskEnqueueSuccess {
    provider: GenerationProvider::Artcraft,
    model: Some(GenerationModel::GptImage1),
    provider_job_id: Some(job_id.to_string()),
    task_type: TaskType::ImageGeneration,
  })
}
