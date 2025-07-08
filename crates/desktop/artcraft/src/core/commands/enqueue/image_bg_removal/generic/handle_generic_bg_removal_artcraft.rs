use crate::core::commands::enqueue::image::enqueue_text_to_image_command::EnqueueTextToImageRequest;
use crate::core::commands::enqueue::image::internal_image_error::InternalImageError;
use crate::core::commands::enqueue::image_bg_removal::enqueue_image_bg_removal_command::EnqueueImageBgRemovalCommand;
use crate::core::commands::enqueue::image_bg_removal::errors::InternalBgRemovalError;
use crate::core::commands::enqueue::image_bg_removal::success_event::EnqueueImageBgRemovalSuccessEvent;
use crate::core::commands::enqueue::image_edit::enqueue_contextual_edit_image_command::{EditImageQuality, EditImageSize, EnqueueContextualEditImageCommand};
use crate::core::commands::enqueue::image_edit::errors::InternalContextualEditImageError;
use crate::core::commands::enqueue::image_edit::success_event::ContextualEditImageSuccessEvent;
use crate::core::events::basic_sendable_event_trait::BasicSendableEvent;
use crate::core::events::generation_events::common::{GenerationAction, GenerationServiceProvider};
use crate::core::events::generation_events::generation_enqueue_failure_event::GenerationEnqueueFailureEvent;
use crate::core::model::contextual_image_edit_models::ContextualImageEditModel;
use crate::core::model::image_models::ImageModel;
use crate::core::state::app_env_configs::app_env_configs::AppEnvConfigs;
use crate::core::state::data_dir::app_data_root::AppDataRoot;
use crate::core::state::provider_priority::ProviderPriorityStore;
use crate::core::utils::save_base64_image_to_temp_dir::save_base64_image_to_temp_dir;
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
use artcraft_api_defs::generate::image::remove_image_background::RemoveImageBackgroundRequest;
use fal_client::requests::queue::image_gen::enqueue_flux_pro_11_ultra_text_to_image::{enqueue_flux_pro_11_ultra_text_to_image, FluxPro11UltraTextToImageArgs};
use fal_client::requests::webhook::image::enqueue_gpt_image_1_edit_image_webhook::GptEditImageQuality;
use idempotency::uuid::generate_random_uuid;
use log::{error, info};
use storyteller_client::credentials::storyteller_credential_set::StorytellerCredentialSet;
use storyteller_client::generate::image::edit::gpt_image_1_edit_image::gpt_image_1_edit_image;
use storyteller_client::generate::image::generate_flux_1_dev_text_to_image::generate_flux_1_dev_text_to_image;
use storyteller_client::generate::image::generate_flux_1_schnell_text_to_image::generate_flux_1_schnell_text_to_image;
use storyteller_client::generate::image::generate_flux_pro_11_text_to_image::generate_flux_pro_11_text_to_image;
use storyteller_client::generate::image::generate_flux_pro_11_ultra_text_to_image::generate_flux_pro_11_ultra_text_to_image;
use storyteller_client::generate::image::remove_image_background::remove_image_background;
use storyteller_client::media_files::upload_image_media_file_from_file::upload_image_media_file_from_file;
use tauri::AppHandle;
use tokens::tokens::media_files::MediaFileToken;

pub async fn handle_generic_bg_removal_artcraft(
  request: &EnqueueImageBgRemovalCommand,
  app: &AppHandle,
  app_data_root: &AppDataRoot,
  app_env_configs: &AppEnvConfigs,
  storyteller_creds_manager: &StorytellerCredentialManager,
) -> Result<EnqueueImageBgRemovalSuccessEvent, InternalBgRemovalError> {

  let creds = match storyteller_creds_manager.get_credentials()? {
    Some(creds) => creds,
    None => {
      return Err(InternalBgRemovalError::NeedsStorytellerCredentials);
    },
  };

  info!("Calling Artcraft bg removal ...");

  let uuid_idempotency_token = generate_random_uuid();

  let image_media_token = match &request.image_media_token {
    Some(image_media_token) => image_media_token.clone(),
    None => {
      upload_image_from_base64_bytes(&request, &app_data_root, &app_env_configs, &creds).await?
    }
  };
  
  let request = RemoveImageBackgroundRequest {
    uuid_idempotency_token,
    media_file_token: Some(image_media_token),
  };

  let result = remove_image_background(
    &app_env_configs.storyteller_host,
    Some(&creds),
    request,
  ).await;

  match result {
    Ok(enqueued) => {
      // TODO(bt,2025-07-05): Enqueue job token?
      info!("Successfully enqueued Artcraft background removal. Job token: {}", 
        enqueued.inference_job_token);
    }
    Err(err) => {
      error!("Failed to use Artcraft background removal: {:?}", err);
      return Err(InternalBgRemovalError::StorytellerError(err));
    }
  }

  Ok(EnqueueImageBgRemovalSuccessEvent {
    service_provider: GenerationServiceProvider::Artcraft,
  })
}

async fn upload_image_from_base64_bytes(
  request: &EnqueueImageBgRemovalCommand, 
  app_data_root: &AppDataRoot, 
  app_env_configs: &AppEnvConfigs, 
  creds: &StorytellerCredentialSet
) -> Result<MediaFileToken, InternalBgRemovalError> {
  let temp_file;
  
  if let Some(base64_bytes) = &request.base64_image {
    info!("Saving base64 image to temp dir ...");
    temp_file = save_base64_image_to_temp_dir(&app_data_root, base64_bytes)
        .await
        .map_err(|err| {
          error!("Failed to save base64 image to temp dir: {:?}", err);
          InternalBgRemovalError::Base64DecodeError
        })?;
  } else {
    return Err(InternalBgRemovalError::MissingImage);
  };

  info!("Uploading image media file from temp file: {:?}", temp_file.path());

  let result = 
      upload_image_media_file_from_file(&app_env_configs.storyteller_host, Some(&creds), temp_file)
          .await
          .map_err(|err| {
            error!("Failed to upload image media file: {:?}", err);
            InternalBgRemovalError::StorytellerError(err)
          })?;
  
  Ok(result.media_file_token)
}
