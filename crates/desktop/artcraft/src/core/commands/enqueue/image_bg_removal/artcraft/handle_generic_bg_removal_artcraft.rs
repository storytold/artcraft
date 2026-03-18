use crate::core::commands::enqueue::generate_error::{BadInputReason, GenerateError, MissingCredentialsReason, ProviderFailureReason};
use crate::core::commands::enqueue::image_bg_removal::enqueue_image_bg_removal_command::EnqueueImageBgRemovalCommand;
use crate::core::commands::enqueue::image_edit::enqueue_edit_image_command::{EditImageQuality, EditImageSize, EnqueueEditImageCommand};
use crate::core::commands::enqueue::task_enqueue_success::TaskEnqueueSuccess;
use crate::core::events::basic_sendable_event_trait::BasicSendableEvent;
use crate::core::events::generation_events::common::{GenerationAction, GenerationServiceProvider};
use crate::core::events::generation_events::generation_enqueue_failure_event::GenerationEnqueueFailureEvent;
use crate::core::state::app_env_configs::app_env_configs::AppEnvConfigs;
use crate::core::state::data_dir::app_data_root::AppDataRoot;
use crate::core::state::provider_priority::ProviderPriorityStore;
use crate::core::utils::save_base64_image_to_temp_dir::save_base64_image_to_temp_dir;
use crate::services::sora::state::sora_credential_manager::SoraCredentialManager;
use crate::services::sora::state::sora_task_queue::SoraTaskQueue;
use crate::services::storyteller::state::storyteller_credential_manager::StorytellerCredentialManager;
use anyhow::anyhow;
use artcraft_api_defs::generate::image::bg_removal::remove_image_background::RemoveImageBackgroundRequest;
use enums::common::generation_provider::GenerationProvider;
use enums::tauri::tasks::task_type::TaskType;
use uuid_utils::uuid::generate_random_uuid;
use log::{error, info};
use artcraft_client::credentials::storyteller_credential_set::StorytellerCredentialSet;
use artcraft_client::endpoints::generate::image::bg_removal::remove_image_background::remove_image_background;
use artcraft_client::endpoints::media_files::upload_image_media_file_from_file::{upload_image_media_file_from_file, UploadImageFromFileArgs};
use tauri::AppHandle;
use tokens::tokens::media_files::MediaFileToken;

pub async fn handle_generic_bg_removal_artcraft(
  request: &EnqueueImageBgRemovalCommand,
  app: &AppHandle,
  app_data_root: &AppDataRoot,
  app_env_configs: &AppEnvConfigs,
  storyteller_creds_manager: &StorytellerCredentialManager,
) -> Result<TaskEnqueueSuccess, GenerateError> {

  let creds = match storyteller_creds_manager.get_credentials()? {
    Some(creds) => creds,
    None => {
      return Err(GenerateError::MissingCredentials(MissingCredentialsReason::NeedsStorytellerCredentials));
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

  let success_result = match result {
    Ok(enqueued) => {
      // TODO(bt,2025-07-05): Enqueue job token?
      info!("Successfully enqueued Artcraft background removal. Job token: {}", 
        enqueued.inference_job_token);
      enqueued
    }
    Err(err) => {
      error!("Failed to use Artcraft background removal: {:?}", err);
      return Err(GenerateError::ProviderFailure(ProviderFailureReason::StorytellerError(err)));
    }
  };

  Ok(TaskEnqueueSuccess {
    provider: GenerationProvider::Artcraft,
    task_type: TaskType::BackgroundRemoval,
    provider_job_id: Some(success_result.inference_job_token.to_string()),
    model: None,
  })
}

async fn upload_image_from_base64_bytes(
  request: &EnqueueImageBgRemovalCommand, 
  app_data_root: &AppDataRoot, 
  app_env_configs: &AppEnvConfigs, 
  creds: &StorytellerCredentialSet
) -> Result<MediaFileToken, GenerateError> {
  let temp_file;
  
  if let Some(base64_bytes) = &request.base64_image {
    info!("Saving base64 image to temp dir ...");
    temp_file = save_base64_image_to_temp_dir(&app_data_root, base64_bytes)
        .await
        .map_err(|err| {
          error!("Failed to save base64 image to temp dir: {:?}", err);
          GenerateError::BadInput(BadInputReason::Base64DecodeError)
        })?;
  } else {
    return Err(GenerateError::BadInput(BadInputReason::RequiredSourceImageNotProvided));
  };

  info!("Uploading image media file from temp file: {:?}", temp_file.path());

  let result =
      upload_image_media_file_from_file(UploadImageFromFileArgs {
        api_host: &app_env_configs.storyteller_host,
        maybe_creds: Some(&creds),
        path: temp_file,
        is_intermediate_system_file: true, // NB: Probably not essential to keep this.
        maybe_prompt_token: None, // NB: Not used for bg removal.
        maybe_batch_token: None, // NB: Not used for bg removal.
      }).await
          .map_err(|err| {
            error!("Failed to upload image media file: {:?}", err);
            GenerateError::ProviderFailure(ProviderFailureReason::StorytellerError(err))
          })?;
  
  Ok(result.media_file_token)
}
