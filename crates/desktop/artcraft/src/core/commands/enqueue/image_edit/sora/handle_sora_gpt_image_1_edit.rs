use crate::core::commands::enqueue::generate_error::{BadInputReason, GenerateError};
use crate::core::commands::enqueue::image_edit::enqueue_edit_image_command::{EditImageSize, EnqueueEditImageCommand, EnqueueEditImageErrorType};
use crate::core::commands::enqueue::task_enqueue_success::TaskEnqueueSuccess;
use crate::core::commands::response::failure_response_wrapper::{CommandErrorResponseWrapper, CommandErrorStatus};
use crate::core::events::basic_sendable_event_trait::BasicSendableEvent;
use crate::core::events::functional_events::show_provider_login_modal_event::ShowProviderLoginModalEvent;
use crate::core::events::generation_events::common::{GenerationAction, GenerationModel, GenerationServiceProvider};
use crate::core::events::generation_events::generation_enqueue_failure_event::GenerationEnqueueFailureEvent;
use crate::core::events::generation_events::generation_enqueue_success_event::GenerationEnqueueSuccessEvent;
use crate::core::state::app_env_configs::app_env_configs::AppEnvConfigs;
use crate::core::state::data_dir::app_data_root::AppDataRoot;
use crate::core::state::data_dir::trait_data_subdir::DataSubdir;
use crate::core::state::provider_priority::ProviderPriorityStore;
use crate::core::utils::get_url_file_extension::get_url_file_extension;
use crate::core::utils::simple_http_download::simple_http_download;
use crate::services::sora::state::sora_credential_manager::SoraCredentialManager;
use crate::services::sora::state::sora_task_queue::SoraTaskQueue;
use crate::services::storyteller::state::storyteller_credential_manager::StorytellerCredentialManager;
use anyhow::anyhow;
use enums::common::generation_provider::GenerationProvider;
use enums::tauri::tasks::task_type::TaskType;
use errors::AnyhowResult;
use uuid_utils::uuid::generate_random_uuid;
use log::{error, info, warn};
use openai_sora_client::recipes::image_remix_with_session_auto_renew::{image_remix_with_session_auto_renew, ImageRemixAutoRenewRequest};
use openai_sora_client::recipes::image_upload_from_file_with_session_auto_renew::{image_upload_from_file_with_session_auto_renew, ImageUploadFromFileAutoRenewRequest};
use openai_sora_client::recipes::maybe_upgrade_or_renew_session::maybe_upgrade_or_renew_session;
use openai_sora_client::requests::image_gen::common::{ImageSize, NumImages};
use std::time::Duration;
use artcraft_client::endpoints::media_files::get_media_file::get_media_file;
use tauri::AppHandle;

const MAX_IMAGES: usize = 4;
const SORA_IMAGE_UPLOAD_TIMEOUT: Duration = Duration::from_millis(1000 * 30); // 30 seconds

const SORA_IMAGE_REMIX_TIMEOUT: Duration = Duration::from_millis(1000 * 30); // 30 seconds

const DEFAULT_ASPECT_RATIO : EditImageSize = EditImageSize::Square;

pub async fn handle_sora_gpt_image_1_edit(
  request: &EnqueueEditImageCommand,
  app: &AppHandle,
  app_data_root: &AppDataRoot,
  app_env_configs: &AppEnvConfigs,
  sora_creds_manager: &SoraCredentialManager,
  sora_task_queue: &SoraTaskQueue,
) -> Result<TaskEnqueueSuccess, GenerateError> {

  let mut creds = match sora_creds_manager.get_credentials() {
    Ok(Some(creds)) => creds,
    Ok(None) => {
      warn!("No Sora credentials found.");
      ShowProviderLoginModalEvent::send_for_provider(GenerationProvider::Sora, &app);
      return Err(GenerateError::needs_sora_credentials());
    }
    Err(err) => {
      error!("Failed to get Sora credentials: {:?}", err);
      ShowProviderLoginModalEvent::send_for_provider(GenerationProvider::Sora, &app);
      return Err(GenerateError::needs_sora_credentials());
    }
  };

  let mut media_tokens = Vec::with_capacity(10);

  if let Some(scene_image_media_token) = request.scene_image_media_token.clone() {
    media_tokens.push(scene_image_media_token);
  }

  if let Some(image_media_tokens) = request.image_media_tokens.as_ref() {
    media_tokens.extend_from_slice(image_media_tokens);
  }

  if media_tokens.len() > MAX_IMAGES {
    return Err(GenerateError::BadInput(BadInputReason::InvalidNumberOfInputImages {
      min: 1,
      max: MAX_IMAGES as u32,
      provided: media_tokens.len() as u32,
    }));
  }

  info!("Calling get media file API: {:?}", app_env_configs.storyteller_host);
  
  let mut files_to_upload_to_sora = Vec::with_capacity(10);
  
  // TODO(bt,2025-07-07): This is inefficient. Cache and parallelize this.
  for media_token in media_tokens.iter() {
    info!("Using media token: {:?}", media_token);

    let response = get_media_file(
      &app_env_configs.storyteller_host,
      media_token
    ).await?;

    let media_file_url = &response.media_file.media_links.cdn_url;
    let extension_with_dot = get_url_file_extension(media_file_url)
        .map(|ext| format!(".{}", ext))
        .unwrap_or_else(|| ".png".to_string());

    let filename = format!("{}{}", response.media_file.token.as_str(), extension_with_dot);
    let filename = app_data_root.downloads_dir().path().join(&filename);

    simple_http_download(&media_file_url, &filename).await?;
    
    files_to_upload_to_sora.push(filename);
  }

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

  let mut sora_media_tokens = Vec::with_capacity(files_to_upload_to_sora.len());

  for (i, file_path) in files_to_upload_to_sora.iter().enumerate() {
    info!("Uploading image {} of {}...", (i+1), files_to_upload_to_sora.len());

    let (response, maybe_new_credentials) =
        image_upload_from_file_with_session_auto_renew(ImageUploadFromFileAutoRenewRequest {
          file_path,
          credentials: &creds,
          request_timeout: Some(SORA_IMAGE_UPLOAD_TIMEOUT), // TODO: Centralize and make configurable.
        }).await?;

    if let Some(new_creds) = maybe_new_credentials {
      info!("Storing updated credentials.");
      sora_creds_manager.set_credentials(&new_creds)?;
      creds = new_creds;
    }

    sora_media_tokens.push(response.id);
  }

  let aspect_ratio = request.aspect_ratio.unwrap_or(DEFAULT_ASPECT_RATIO);

  let aspect_ratio = match aspect_ratio {
    EditImageSize::Auto => ImageSize::Square,
    EditImageSize::Square => ImageSize::Square,
    EditImageSize::Wide => ImageSize::Wide,
    EditImageSize::Tall => ImageSize::Tall,
  };

  info!("Calling Sora image generation...");

  // TODO(bt,2025-04-21): Download media tokens.
  //  Note: This is incredibly inefficient. We should keep a local cache.
  //  Also, if they've already been uploaded to OpenAI, we shouldn't continue to re-upload.

  let (response, maybe_new_creds) =
      image_remix_with_session_auto_renew(ImageRemixAutoRenewRequest {
        prompt: request.prompt.to_string(),
        num_images: NumImages::One,
        image_size: aspect_ratio,
        sora_media_tokens: sora_media_tokens.clone(),
        credentials: &creds,
        request_timeout: Some(SORA_IMAGE_REMIX_TIMEOUT),
      }).await?;

  if let Some(new_creds) = maybe_new_creds {
    info!("Storing updated credentials.");
    sora_creds_manager.set_credentials(&new_creds)?;
  }

  info!("New Sora Task ID: {:?} ", response.task_id);

  sora_task_queue.insert(&response.task_id)?;

  Ok(TaskEnqueueSuccess {
    task_type: TaskType::ImageGeneration,
    model: Some(GenerationModel::GptImage1),
    provider: GenerationProvider::Sora,
    provider_job_id: Some(response.task_id.to_string()),
  })
}
