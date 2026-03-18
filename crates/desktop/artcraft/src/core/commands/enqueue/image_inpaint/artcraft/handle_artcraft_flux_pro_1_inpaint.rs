use crate::core::commands::enqueue::generate_error::{BadInputReason, GenerateError};
use crate::core::commands::enqueue::image_bg_removal::enqueue_image_bg_removal_command::EnqueueImageBgRemovalCommand;
use crate::core::commands::enqueue::image_edit::enqueue_edit_image_command::{EditImageQuality, EditImageSize, EnqueueEditImageCommand};
use crate::core::commands::enqueue::image_inpaint::enqueue_image_inpaint_command::EnqueueInpaintImageCommand;
use crate::core::commands::enqueue::task_enqueue_success::TaskEnqueueSuccess;
use crate::core::events::basic_sendable_event_trait::BasicSendableEvent;
use crate::core::events::generation_events::common::{GenerationAction, GenerationModel, GenerationServiceProvider};
use crate::core::events::generation_events::generation_enqueue_failure_event::GenerationEnqueueFailureEvent;
use crate::core::state::app_env_configs::app_env_configs::AppEnvConfigs;
use crate::core::state::data_dir::app_data_root::AppDataRoot;
use crate::core::state::provider_priority::ProviderPriorityStore;
use crate::core::utils::save_base64_image_to_temp_dir::save_base64_image_to_temp_dir;
use crate::services::sora::state::sora_credential_manager::SoraCredentialManager;
use crate::services::sora::state::sora_task_queue::SoraTaskQueue;
use crate::services::storyteller::state::storyteller_credential_manager::StorytellerCredentialManager;
use anyhow::anyhow;
use artcraft_api_defs::generate::image::edit::gpt_image_1_edit_image::{GptImage1EditImageImageQuality, GptImage1EditImageImageSize, GptImage1EditImageNumImages, GptImage1EditImageRequest};
use artcraft_api_defs::generate::image::inpaint::flux_pro_1_inpaint_image::{FluxPro1InpaintImageNumImages, FluxPro1InpaintImageRequest};
use enums::common::generation_provider::GenerationProvider;
use enums::tauri::tasks::task_type::TaskType;
use uuid_utils::uuid::generate_random_uuid;
use images::encoding::image_bytes_to_png_bytes::image_bytes_to_png_bytes;
use images::encoding::image_bytes_to_png_bytes_with_dimensions::image_bytes_to_png_bytes_with_dimensions;
use images::mask_images::normalize_image_bytes_to_flux_mask::normalize_image_bytes_to_flux_mask;
use log::{error, info};
use mimetypes::mimetype_info::mimetype_info::MimetypeInfo;
use artcraft_client::credentials::storyteller_credential_set::StorytellerCredentialSet;
use artcraft_client::endpoints::generate::image::edit::gpt_image_1_edit_image::gpt_image_1_edit_image;
use artcraft_client::endpoints::generate::image::inpaint::flux_pro_1_inpaint_image::flux_pro_1_inpaint_image;
use artcraft_client::endpoints::media_files::get_media_file::get_media_file;
use artcraft_client::endpoints::media_files::upload_image_media_file_from_bytes::{upload_image_media_file_from_bytes, ImageType, UploadImageBytesArgs};
use artcraft_client::endpoints::media_files::upload_image_media_file_from_file::upload_image_media_file_from_file;
use tauri::AppHandle;
use tokens::tokens::media_files::MediaFileToken;

pub async fn handle_artcraft_flux_pro_1_inpaint(
  request: &EnqueueInpaintImageCommand,
  app: &AppHandle,
  app_data_root: &AppDataRoot,
  app_env_configs: &AppEnvConfigs,
  storyteller_creds_manager: &StorytellerCredentialManager,
) -> Result<TaskEnqueueSuccess, GenerateError> {

  let creds = match storyteller_creds_manager.get_credentials()? {
    Some(creds) => creds,
    None => {
      return Err(GenerateError::needs_storyteller_credentials());
    },
  };

  let image_media_token = match &request.image_media_token {
    Some(token) => token.clone(),
    None => {
      return Err(GenerateError::required_source_image_not_provided());
    },
  };

  let mask_media_token = get_mask(
    request,
    app_env_configs,
    &creds,
  ).await?;

  info!("Calling Artcraft flux pro 1 inpaint ...");

  let uuid_idempotency_token = generate_random_uuid();

  let num_images = match request.image_count {
    None => None,
    Some(1) => Some(FluxPro1InpaintImageNumImages::One),
    Some(2) => Some(FluxPro1InpaintImageNumImages::Two),
    Some(3) => Some(FluxPro1InpaintImageNumImages::Three),
    Some(4) => Some(FluxPro1InpaintImageNumImages::Four),
    Some(other) => {
      return Err(GenerateError::BadInput(BadInputReason::InvalidNumberOfRequestedImages {
        min: 1,
        max: 4,
        requested: other,
      }));
    },
  };

  let request = FluxPro1InpaintImageRequest {
    uuid_idempotency_token,
    prompt: Some(request.prompt.clone()),
    image_media_token,
    mask_media_token,
    num_images,
  };

  let result = flux_pro_1_inpaint_image(
    &app_env_configs.storyteller_host,
    Some(&creds),
    request,
  ).await;
  
  let job_id = match result {
    Ok(enqueued) => {
      // TODO(bt,2025-07-05): Enqueue job token?
      info!("Successfully enqueued Artcraft flux pro 1 inpaint. Job token: {}",
        enqueued.inference_job_token);
      enqueued.inference_job_token
    }
    Err(err) => {
      error!("Failed to use Artcraft flux pro 1 inpaint: {:?}", err);
      return Err(GenerateError::from(err));
    }
  };
  
  Ok(TaskEnqueueSuccess {
    provider: GenerationProvider::Artcraft,
    model: Some(GenerationModel::FluxPro1),
    provider_job_id: Some(job_id.to_string()),
    task_type: TaskType::ImageInpaintEdit,
  })
}

async fn get_mask(
  request: &EnqueueInpaintImageCommand,
  app_env_configs: &AppEnvConfigs,
  storyteller_creds: &StorytellerCredentialSet,
) -> Result<MediaFileToken, GenerateError> {

  if request.mask_image_media_token.is_some() && request.mask_image_raw_bytes.is_some() {
    return Err(GenerateError::both_image_mask_media_token_and_bytes_supplied());
  }

  if let Some(token) = request.mask_image_media_token.as_ref() {
    return Ok(token.clone());
  };

  let image_bytes = request.mask_image_raw_bytes.as_ref()
    .ok_or(GenerateError::required_source_image_mask_not_provided())?;

  let image_bytes = normalize_image_bytes_to_flux_mask(image_bytes)
      .map_err(|err| {
        error!("Failed to convert image bytes to png: {:?}", err);
        GenerateError::AnyhowError(anyhow!("could not encode image mask to png"))
      })?;

  info!("Uploading image media file from bytes...");

  let result = upload_image_media_file_from_bytes(UploadImageBytesArgs {
    api_host: &app_env_configs.storyteller_host,
    maybe_creds: Some(&storyteller_creds),
    image_bytes: image_bytes.0,
    image_type: ImageType::Png,
    is_intermediate_system_file: true,
  }).await
      .map_err(|err| {
        error!("Failed to upload image media file: {:?}", err);
        GenerateError::from(err)
      })?;

  Ok(result.media_file_token)
}
