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
use artcraft_api_defs::generate::image::edit::flux_pro_kontext_max_edit_image::{FluxProKontextMaxEditImageNumImages, FluxProKontextMaxEditImageRequest};
use artcraft_api_defs::generate::image::edit::gemini_25_flash_edit_image::{Gemini25FlashEditImageNumImages, Gemini25FlashEditImageRequest};
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
use artcraft_client::endpoints::generate::image::edit::flux_pro_kontext_max_edit_image::flux_pro_kontext_max_edit_image;
use artcraft_client::endpoints::generate::image::edit::gemini_25_flash_edit_image::gemini_25_flash_edit_image;
use artcraft_client::endpoints::generate::image::edit::gpt_image_1_edit_image::gpt_image_1_edit_image;
use artcraft_client::endpoints::generate::image::inpaint::flux_pro_1_inpaint_image::flux_pro_1_inpaint_image;
use artcraft_client::endpoints::media_files::get_media_file::get_media_file;
use artcraft_client::endpoints::media_files::upload_image_media_file_from_bytes::{upload_image_media_file_from_bytes, ImageType, UploadImageBytesArgs};
use artcraft_client::endpoints::media_files::upload_image_media_file_from_file::upload_image_media_file_from_file;
use tauri::AppHandle;
use tokens::tokens::media_files::MediaFileToken;

pub async fn handle_artcraft_nano_banana_inpaint(
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

  info!("Calling Artcraft gemini 2.5 flash inpaint ...");

  let uuid_idempotency_token = generate_random_uuid();

  let num_images = match request.image_count {
    None => None,
    Some(1) => Some(Gemini25FlashEditImageNumImages::One),
    Some(2) => Some(Gemini25FlashEditImageNumImages::Two),
    Some(3) => Some(Gemini25FlashEditImageNumImages::Three),
    Some(4) => Some(Gemini25FlashEditImageNumImages::Four),
    Some(other) => {
      return Err(GenerateError::BadInput(BadInputReason::InvalidNumberOfRequestedImages {
        min: 1,
        max: 4,
        requested: other,
      }));
    },
  };

  let request = Gemini25FlashEditImageRequest {
    uuid_idempotency_token,
    prompt: Some(request.prompt.clone()),
    image_media_tokens: Some(vec![image_media_token]),
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
      info!("Successfully enqueued Artcraft gemini 2.5 flash inpaint. Job token: {}",
        enqueued.inference_job_token);
      enqueued.inference_job_token
    }
    Err(err) => {
      error!("Failed to use Artcraft gemini 2.5 flash inpaint: {:?}", err);
      return Err(GenerateError::from(err));
    }
  };
  
  Ok(TaskEnqueueSuccess {
    provider: GenerationProvider::Artcraft,
    model: Some(GenerationModel::Gemini25Flash),
    provider_job_id: Some(job_id.to_string()),
    task_type: TaskType::ImageInpaintEdit,
  })
}
