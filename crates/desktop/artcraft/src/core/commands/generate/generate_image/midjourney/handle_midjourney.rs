use crate::core::commands::enqueue::generate_error::{GenerateError, MissingCredentialsReason, ProviderFailureReason};
use crate::core::commands::enqueue::image_edit::enqueue_edit_image_command::{EditImageQuality, EditImageSize};
use crate::core::commands::enqueue::task_enqueue_success::TaskEnqueueSuccess;
use crate::core::commands::enqueue::text_to_image::enqueue_text_to_image_command::{EnqueueTextToImageRequest, TextToImageSize};
use crate::core::events::basic_sendable_event_trait::BasicSendableEvent;
use crate::core::events::functional_events::canvas_background_removal_complete_event::CanvasBackgroundRemovalCompleteEvent;
use crate::core::events::functional_events::show_provider_login_modal_event::ShowProviderLoginModalEvent;
use crate::core::events::generation_events::common::{GenerationAction, GenerationModel, GenerationServiceProvider};
use crate::core::events::generation_events::generation_enqueue_failure_event::GenerationEnqueueFailureEvent;
use crate::core::events::warning_events::flash_user_input_error_event::FlashUserInputErrorEvent;
use crate::core::state::app_env_configs::app_env_configs::AppEnvConfigs;
use crate::core::state::data_dir::app_data_root::AppDataRoot;
use crate::core::state::provider_priority::ProviderPriorityStore;
use crate::services::midjourney::state::midjourney_credential_manager::MidjourneyCredentialManager;
use crate::services::sora::state::sora_credential_manager::SoraCredentialManager;
use crate::services::sora::state::sora_task_queue::SoraTaskQueue;
use crate::services::storyteller::state::storyteller_credential_manager::StorytellerCredentialManager;
use enums::common::generation_provider::GenerationProvider;
use enums::tauri::tasks::task_type::TaskType;
use uuid_utils::uuid::generate_random_uuid;
use log::{error, info};
use midjourney_client::client::midjourney_hostname::MidjourneyHostname;
use midjourney_client::endpoints::submit_job::{submit_job, SubmitJobRequest};
use midjourney_client::error::midjourney_api_error::MidjourneyApiError;
use midjourney_client::recipes::channel_id::ChannelId;
use midjourney_client::recipes::text_to_image::{text_to_image, TextToImageError, TextToImageRequest};
use openai_sora_client::recipes::maybe_upgrade_or_renew_session::maybe_upgrade_or_renew_session;
use openai_sora_client::recipes::simple_image_gen_with_session_auto_renew::{simple_image_gen_with_session_auto_renew, SimpleImageGenAutoRenewRequest};
use openai_sora_client::requests::image_gen::common::{ImageSize, NumImages};
use std::time::Duration;
use tauri::AppHandle;
use tokens::tokens::media_files::MediaFileToken;

pub async fn handle_midjourney(
  app: &AppHandle,
  request: &EnqueueTextToImageRequest,
  app_env_configs: &AppEnvConfigs,
  mj_creds_manager: &MidjourneyCredentialManager,
) -> Result<TaskEnqueueSuccess, GenerateError> {

  let creds = match mj_creds_manager.maybe_copy_cookie_store() {
    Ok(Some(creds)) => creds,
    Ok(None) => {
      error!("Midjourney credentials not found.");
      ShowProviderLoginModalEvent::send_for_provider(GenerationProvider::Midjourney, &app);
      return Err(GenerateError::needs_midjourney_credentials());
    }
    Err(err) => {
      error!("Error reading Midjourney credentials: {:?}", err);
      ShowProviderLoginModalEvent::send_for_provider(GenerationProvider::Midjourney, &app);
      return Err(GenerateError::needs_midjourney_credentials());
    },
  };

  // TODO: We can request population of the user info if absent or expired.
  
  let user_info = match mj_creds_manager.maybe_copy_user_info() {
    Ok(Some(user_info)) => user_info,
    Ok(None) => {
      return Err(GenerateError::MissingCredentials(MissingCredentialsReason::NeedsMidjourneyUserInfo));
    }
    Err(err) => {
      error!("Error reading Midjourney user info: {:?}", err);
      return Err(GenerateError::MissingCredentials(MissingCredentialsReason::NeedsMidjourneyUserInfo));
    },
  };

  let channel_id = match user_info.user_id {
    Some(user_id) => ChannelId::UserId(user_id),
    None => {
      error!("Midjourney user info does not contain a user ID.");
      return Err(GenerateError::MissingCredentials(MissingCredentialsReason::NeedsMidjourneyUserId));
    }
  };

  info!("Calling midjourney ...");

  let cookie_header = creds.to_cookie_string();

  let prompt = request.prompt
      .as_deref()
      .unwrap_or("");

  let result = text_to_image(TextToImageRequest {
    prompt,
    channel_id: &channel_id,
    hostname: MidjourneyHostname::Standard,
    cookie_header,
  }).await;

  let result = match result {
    Ok(result) => result,
    Err(err) => {
      error!("Failed to use MidJourney: {:?}", err);
      return Err(GenerateError::from(err));
    }
  };
  
  let job_id = match result.maybe_job_id {
    Some(job_id) => job_id,
    None => {
      error!("Failed to enqueue MidJourney: No job ID returned.");
      return handle_midjourney_errors(app, result.maybe_errors);
    }
  };

  info!("Successfully enqueued MidJourney. Job token: {}", job_id);

  Ok(TaskEnqueueSuccess {
    provider: GenerationProvider::Midjourney,
    model: Some(GenerationModel::Midjourney),
    provider_job_id: Some(job_id),
    task_type: TaskType::ImageGeneration,
  })
}

fn handle_midjourney_errors(
  app: &AppHandle,
  maybe_errors: Option<Vec<TextToImageError>>
) -> Result<TaskEnqueueSuccess, GenerateError> {
  if let Some(errors) = maybe_errors {
    if !errors.is_empty() {
      let messages: Vec<String> = errors.iter()
          .map(|e| format!("{:?}", e))
          .collect();

      let combined_message = messages.join("; ");

      let event = FlashUserInputErrorEvent {
        message: format!("Midjourney Error: {}", combined_message),
      };

      if let Err(err) = event.send(&app) {
        error!("Failed to send FlashUserInputErrorEvent: {:?}", err); // Fail open
      }
    }
  }
  
  Err(GenerateError::ProviderFailure(ProviderFailureReason::MidjourneyJobEnqueueFailed))
}
