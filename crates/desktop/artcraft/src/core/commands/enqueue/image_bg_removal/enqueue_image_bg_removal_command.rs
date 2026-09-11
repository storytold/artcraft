use crate::core::commands::enqueue::common::notify_frontend_of_errors::notify_frontend_of_errors;
use crate::core::commands::enqueue::generate_error::{BadInputReason, GenerateError};
use crate::core::commands::enqueue::image_bg_removal::artcraft::handle_generic_bg_removal_artcraft::handle_generic_bg_removal_artcraft;
use crate::core::commands::enqueue::task_enqueue_success::TaskEnqueueSuccess;
use crate::core::commands::response::failure_response_wrapper::{CommandErrorResponseWrapper, CommandErrorStatus};
use crate::core::commands::response::shorthand::{Response, ResponseOrErrorType};
use crate::core::commands::response::success_response_wrapper::SerializeMarker;
use crate::core::events::basic_sendable_event_trait::BasicSendableEvent;
use crate::core::events::functional_events::credits_balance_changed_event::CreditsBalanceChangedEvent;
use crate::core::events::generation_events::common::{GenerationAction, GenerationServiceProvider};
use crate::core::events::generation_events::generation_enqueue_failure_event::GenerationEnqueueFailureEvent;
use crate::core::events::generation_events::generation_enqueue_success_event::GenerationEnqueueSuccessEvent;
use crate::core::events::sendable_event_trait::SendableEvent;
use crate::core::state::app_env_configs::app_env_configs::AppEnvConfigs;
use crate::core::state::artcraft_usage_tracker::artcraft_usage_tracker::ArtcraftUsageTracker;
use crate::core::state::artcraft_usage_tracker::artcraft_usage_type::{ArtcraftUsagePage, ArtcraftUsageType};
use crate::core::state::data_dir::app_data_root::AppDataRoot;
use crate::core::state::data_dir::trait_data_subdir::DataSubdir;
use crate::core::state::provider_priority::{Provider, ProviderPriorityStore};
use crate::core::state::task_database::TaskDatabase;
use crate::core::utils::get_url_file_extension::get_url_file_extension;
use crate::core::utils::simple_http_download::simple_http_download;
use crate::services::sora::state::sora_credential_manager::SoraCredentialManager;
use crate::services::sora::state::sora_task_queue::SoraTaskQueue;
use crate::services::storyteller::state::storyteller_credential_manager::StorytellerCredentialManager;
use enums::tauri::ux::tauri_command_caller::TauriCommandCaller;
use errors::AnyhowError;
use log::{error, info, warn};
use openai_sora_client::recipes::image_remix_with_session_auto_renew::{image_remix_with_session_auto_renew, ImageRemixAutoRenewRequest};
use openai_sora_client::recipes::image_upload_from_file_with_session_auto_renew::{image_upload_from_file_with_session_auto_renew, ImageUploadFromFileAutoRenewRequest};
use openai_sora_client::recipes::maybe_upgrade_or_renew_session::maybe_upgrade_or_renew_session;
use openai_sora_client::requests::image_gen::common::{ImageSize, NumImages};
use serde_derive::{Deserialize, Serialize};
use sqlite_tasks::queries::create_task::{create_task, CreateTaskArgs};
use std::time::Duration;
use artcraft_client::endpoints::media_files::get_media_file::get_media_file;
use artcraft_client::error::storyteller_error::StorytellerError;
use artcraft_client::utils::api_host::ApiHost;
use tauri::{AppHandle, Manager, State};
use tokens::tokens::media_files::MediaFileToken;

#[derive(Deserialize, Debug)]
pub struct EnqueueImageBgRemovalCommand {
  // /// The bg removal model to use (optional).
  // pub model: Option<TODO>,

  /// Image media file; the image to remove the background from.
  pub image_media_token: Option<MediaFileToken>,

  /// Base64-encoded image
  pub base64_image: Option<String>,

  /// OPTIONAL.
  /// Name of the frontend caller.
  /// We'll use this to selectively trigger events.
  pub frontend_caller: Option<TauriCommandCaller>,

  /// OPTIONAL.
  /// A frontend-defined identifier that we'll send back to the frontend
  /// as a Tauri event on task completion.
  pub frontend_subscriber_id: Option<String>,

  /// OPTIONAL.
  /// A frontend-defined payload that we'll send back to the frontend
  /// as a Tauri event on task completion.
  pub frontend_subscriber_payload: Option<String>,
}

#[derive(Serialize, Debug)]
#[serde(rename_all = "snake_case")]
pub enum EnqueueImageBgRemovalErrorType {
  /// No model available for image generation
  NoProviderAvailable,

  /// No image was provided for background removal
  MissingImage,
  
  /// Bad base64 image data
  Base64DecodeError,
  
  /// Generic bad request error
  BadRequest,

  /// Generic server error
  ServerError,
}

#[derive(Serialize)]
pub struct EnqueueImageBgRemovalSuccessResponse {
}

impl SerializeMarker for EnqueueImageBgRemovalSuccessResponse {}

#[tauri::command]
pub async fn enqueue_image_bg_removal_command(
  app: AppHandle,
  request: EnqueueImageBgRemovalCommand,
  app_data_root: State<'_, AppDataRoot>,
  app_env_configs: State<'_, AppEnvConfigs>,
  artcraft_usage_tracker: State<'_, ArtcraftUsageTracker>,
  provider_priority_store: State<'_, ProviderPriorityStore>,
  task_database: State<'_, TaskDatabase>,
  storyteller_creds_manager: State<'_, StorytellerCredentialManager>,
) -> ResponseOrErrorType<EnqueueImageBgRemovalSuccessResponse, EnqueueImageBgRemovalErrorType> {

  info!("enqueue_image_bg_removal_command called");

  let result = handle_request(
    &request,
    &app,
    &app_data_root,
    &app_env_configs,
    &artcraft_usage_tracker,
    &provider_priority_store,
    &task_database,
    &storyteller_creds_manager,
  ).await;

  match result {
    Err(err) => {
      error!("Error removing background: {:?}", err);
      
      notify_frontend_of_errors(&app, &err).await;

      // TODO: Derive from err. Make service provider optional.
      let event = GenerationEnqueueFailureEvent {
        action: GenerationAction::RemoveBackground,
        service: GenerationServiceProvider::Artcraft, // FIXME: This is wrong.
        model: None,
        reason: None,
      };

      if let Err(err) = event.send(&app) {
        error!("Failed to emit event: {:?}", err); // Fail open.
      }

      Err(error_to_tauri_response(err))
    }
    Ok(event) => {
      let event = GenerationEnqueueSuccessEvent {
        action: event.to_frontend_event_action(),
        service: event.to_frontend_event_service(),
        model: None, // FIXME: This isn't right, though we probably don't care for simple bg removal.
      };

      if let Err(err) = event.send(&app) {
        error!("Failed to emit event: {:?}", err); // Fail open.
      }

      CreditsBalanceChangedEvent{}.send_infallible(&app);

      Ok(EnqueueImageBgRemovalSuccessResponse {}.into())
    }
  }
}

pub async fn handle_request(
  request: &EnqueueImageBgRemovalCommand,
  app: &AppHandle,
  app_data_root: &AppDataRoot,
  app_env_configs: &AppEnvConfigs,
  artcraft_usage_tracker: &ArtcraftUsageTracker,
  provider_priority_store: &ProviderPriorityStore,
  task_database: &TaskDatabase,
  storyteller_creds_manager: &StorytellerCredentialManager,
) -> Result<TaskEnqueueSuccess, GenerateError> {
  
  // TODO(bt,2025-07-07): Other model/provider routing...
  
  let success_event = handle_generic_bg_removal_artcraft(
    request,
    app,
    app_data_root,
    app_env_configs,
    storyteller_creds_manager,
  ).await?;

  let result = success_event
      .insert_into_task_database_with_frontend_payload(
        task_database,
        request.frontend_caller,
        request.frontend_subscriber_id.as_deref(),
        request.frontend_subscriber_payload.as_deref()
      )
      .await;

  if let Err(err) = result {
    error!("Failed to create task in database: {:?}", err);
    // NB: Fail open, but find a way to flag this.
  }
  
  if let Err(err) = artcraft_usage_tracker.record_image_generation(1, ArtcraftUsageType::ImageToResult, ArtcraftUsagePage::EditPage) {
    // NB: Fail open.
    warn!("Failed to report usage: {:?}", err);
  }

  Ok(success_event)
}

fn error_to_tauri_response(error: GenerateError) -> CommandErrorResponseWrapper<EnqueueImageBgRemovalErrorType, ()> {
  let mut status = CommandErrorStatus::ServerError;
  let mut error_type = EnqueueImageBgRemovalErrorType::ServerError;
  let mut error_message = "A server error occurred. Please try again. If it continues, please tell our staff about the problem.".to_string();

  match error {
    GenerateError::NoProviderAvailable => {
      status = CommandErrorStatus::ServerError;
      error_type = EnqueueImageBgRemovalErrorType::NoProviderAvailable;
      error_message = "No configured provider available for background removal".to_string();
    }
    GenerateError::BadInput(BadInputReason::RequiredSourceImageNotProvided) => {
      status = CommandErrorStatus::BadRequest;
      error_type = EnqueueImageBgRemovalErrorType::MissingImage;
      error_message = "No image provided for background removal".to_string();
    }
    GenerateError::BadInput(BadInputReason::Base64DecodeError) => {
      status = CommandErrorStatus::BadRequest;
      error_type = EnqueueImageBgRemovalErrorType::Base64DecodeError;
      error_message = "Failed to decode base64 image data".to_string();
    }
    _ => {}, // Other cases fall through.
  }

  CommandErrorResponseWrapper {
    status,
    error_message: Some(error_message.to_string()),
    error_type: Some(error_type),
    error_details: None,
  }
}
