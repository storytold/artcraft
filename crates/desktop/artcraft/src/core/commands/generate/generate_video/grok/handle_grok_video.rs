use crate::core::commands::enqueue::generate_error::{BadInputReason, GenerateError};
use crate::core::commands::deprecated::image_edit::enqueue_edit_image_command::EnqueueEditImageCommand;
use crate::core::commands::deprecated::image_inpaint::enqueue_image_inpaint_command::EnqueueInpaintImageCommand;
use crate::core::commands::generate::generate_video::request::{TauriGenerateVideoRequest, GrokAspectRatio, SoraOrientation};
use crate::core::commands::enqueue::task_enqueue_success::TaskEnqueueSuccess;
use crate::core::events::functional_events::show_provider_login_modal_event::ShowProviderLoginModalEvent;
use crate::core::events::generation_events::common::GenerationModel;
use crate::core::state::app_env_configs::app_env_configs::AppEnvConfigs;
use crate::core::state::data_dir::app_data_root::AppDataRoot;
use crate::core::state::provider_priority::{Provider, ProviderPriorityStore};
use crate::core::utils::download_media_file_to_temp_dir::download_media_file_to_temp_dir;
use crate::services::grok::state::grok_credential_manager::GrokCredentialManager;
use crate::services::grok::util::upload_image_media_file_to_grok::{upload_image_media_file_to_grok, UploadImageMediaFileToGrok};
use crate::services::sora::state::sora_credential_manager::SoraCredentialManager;
use crate::services::sora::state::sora_task_queue::SoraTaskQueue;
use crate::services::sora::utils::upload_images_to_sora::{upload_images_to_sora, UploadImagesToSoraArgs};
use crate::services::storyteller::state::storyteller_credential_manager::StorytellerCredentialManager;
use enums::common::generation_provider::GenerationProvider;
use enums::tauri::tasks::task_type::TaskType;
use grok_consumer_client::credentials::grok_cookies::GrokCookies;
use grok_consumer_client::credentials::grok_full_credentials::GrokFullCredentials;
use grok_consumer_client::datatypes::api::aspect_ratio::AspectRatio;
use grok_consumer_client::datatypes::file_upload_spec::FileUploadSpec;
use grok_consumer_client::recipes::request_client_secrets::{request_client_secrets, RequestClientSecretsArgs};
use grok_consumer_client::recipes::upload_image_and_generate_video::{upload_image_and_generate_video, UploadImageAndGenerateVideo};
use grok_consumer_client::recipes::upload_image_and_generate_video_with_retry::{upload_image_and_generate_video_with_retry, UploadImageAndGenerateVideoWithRetry};
use log::{error, info, warn};
use openai_sora_client::recipes::generate_sora2_video::generate_sora2_video_with_session_auto_renew::generate_sora2_video_with_session_auto_renew;
use openai_sora_client::requests::generate_sora2_video::generate_sora2_video::{GenerateSora2VideoArgs, Orientation};
use std::time::Duration;
use tauri::AppHandle;

const GROK_IMAGE_UPLOAD_TIMEOUT: Duration = Duration::from_millis(1000 * 30); // 30 seconds

pub async fn handle_grok_video(
  request: &TauriGenerateVideoRequest,
  app: &AppHandle,
  app_data_root: &AppDataRoot,
  app_env_configs: &AppEnvConfigs,
  grok_credential_manager: &GrokCredentialManager,
) -> Result<TaskEnqueueSuccess, GenerateError> {

  let creds = get_grok_creds(app, grok_credential_manager).await?;

  let image_token = match request.image_media_token.as_ref() {
    Some(token) => token,
    None => {
      return Err(GenerateError::BadInput(BadInputReason::InvalidNumberOfInputImages { min: 1, max: 1, provided: 0 }))
    }
  };

  info!("Downloading image media file...");

  let local_image_file = download_media_file_to_temp_dir(
    &app_env_configs,
    &app_data_root,
    image_token,
  ).await?;

  let aspect_ratio = match request.grok_aspect_ratio {
    None => AspectRatio::WideThreeByTwo,
    Some(GrokAspectRatio::Landscape) => AspectRatio::WideThreeByTwo,
    Some(GrokAspectRatio::Portrait) => AspectRatio::TallTwoByThree,
    Some(GrokAspectRatio::Square) => AspectRatio::Square,
  };

  info!("Calling Grok Video generate...");

  let upload_result = upload_image_and_generate_video_with_retry(UploadImageAndGenerateVideoWithRetry {
    credentials: &creds,
    file: FileUploadSpec::Path(local_image_file.path()),
    prompt: request.prompt.as_deref(),
    aspect_ratio: Some(aspect_ratio),
    wait_for_generation: false,
    individual_request_timeout: Some(GROK_IMAGE_UPLOAD_TIMEOUT),
    mode: None,
  }).await;

  let post_id = match upload_result {
    Err(err) => {
      error!("Failed to use Grok video: {:?}", err);
      return Err(GenerateError::from(err));
    }
    Ok(result) => {
      if let Some(secrets) = result.maybe_new_client_secrets {
        info!("New Grok secrets generated! Storing them in the credential manager...");
        grok_credential_manager.replace_client_secrets_only(secrets)?;
      }
      info!("Successfully enqueued Grok Video: post_id = {:?}", result.upload_result.post_id);
      result.upload_result.post_id
    }
  };

  Ok(TaskEnqueueSuccess {
    provider: GenerationProvider::Grok,
    model: Some(GenerationModel::GrokVideo),
    provider_job_id: Some(post_id.to_string()),
    task_type: TaskType::VideoGeneration,
    maybe_queue_status_url: None,
    maybe_prompt_token: None,
    maybe_queue_response_url: None,
  })
}

async fn get_grok_creds(app: &AppHandle, grok_credential_manager: &GrokCredentialManager) -> Result<GrokFullCredentials, GenerateError> {
  if let Some(creds) = grok_credential_manager.maybe_copy_full_credentials()? {
    return Ok(creds);
  }

  let cookies = match grok_credential_manager.maybe_copy_cookie_store()? {
    Some(cookies) => cookies.to_cookie_string(),
    None => {
      warn!("No Grok Cookie stored. Must login.");
      ShowProviderLoginModalEvent::send_for_provider(GenerationProvider::Grok, &app);
      return Err(GenerateError::needs_grok_credentials())
    }
  };

  let cookies = GrokCookies::new(cookies);

  info!("Requesting Grok client secrets...");

  let upgraded = request_client_secrets(RequestClientSecretsArgs {
    cookies: &cookies,
  }).await;

  match upgraded {
    Err(err) => {
      error!("Failed to fetch Grok client secrets: {}", err); // NB: Fall-through
    }
    Ok(secrets) => {
      info!("Grok client secrets successfully upgraded...");
      let full_creds = GrokFullCredentials::from_cookies_and_client_secrets(cookies, secrets);
      grok_credential_manager.replace_full_credentials(full_creds.clone())?;
      info!("Persisting grok credentials to disk...");
      grok_credential_manager.persist_to_disk()?;
      return Ok(full_creds)
    }
  }

  warn!("Grok upgrade failed. Try logging in again...");

  ShowProviderLoginModalEvent::send_for_provider(GenerationProvider::Grok, &app);
  Err(GenerateError::needs_grok_credentials())
}
