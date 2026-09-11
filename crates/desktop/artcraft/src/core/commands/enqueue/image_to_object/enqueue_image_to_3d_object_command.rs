use crate::core::commands::enqueue::common::notify_frontend_of_errors::notify_frontend_of_errors;
use crate::core::commands::enqueue::generate_error::{BadInputReason, GenerateError, MissingCredentialsReason};
use crate::core::commands::enqueue::image_to_object::artcraft::handle_artcraft_object::handle_artcraft_object;
use crate::core::commands::enqueue::task_enqueue_success::TaskEnqueueSuccess;
use crate::core::commands::response::failure_response_wrapper::{CommandErrorResponseWrapper, CommandErrorStatus};
use crate::core::commands::response::shorthand::Response;
use crate::core::commands::response::success_response_wrapper::SerializeMarker;
use crate::core::events::basic_sendable_event_trait::BasicSendableEvent;
use crate::core::events::functional_events::credits_balance_changed_event::CreditsBalanceChangedEvent;
use crate::core::events::generation_events::generation_enqueue_success_event::GenerationEnqueueSuccessEvent;
use crate::core::state::app_env_configs::app_env_configs::AppEnvConfigs;
use crate::core::state::data_dir::app_data_root::AppDataRoot;
use crate::core::state::provider_priority::{Provider, ProviderPriorityStore};
use crate::core::state::task_database::TaskDatabase;
use crate::services::sora::state::sora_task_queue::SoraTaskQueue;
use crate::services::storyteller::state::storyteller_credential_manager::StorytellerCredentialManager;
use enums::tauri::ux::tauri_command_caller::TauriCommandCaller;
use log::{error, info, warn};
use serde_derive::{Deserialize, Serialize};
use tauri::{AppHandle, State};
use tokens::tokens::media_files::MediaFileToken;
use crate::core::state::artcraft_usage_tracker::artcraft_usage_tracker::ArtcraftUsageTracker;
use crate::core::state::artcraft_usage_tracker::artcraft_usage_type::{ArtcraftUsagePage, ArtcraftUsageType};

#[derive(Deserialize)]
pub struct EnqueueImageTo3dObjectRequest {
  /// Image media file; the image to remove the background from.
  /// TODO: In the future we may support base64 images, URLs, or file paths here.
  pub image_media_token: Option<MediaFileToken>,
  
  /// The model to use.
  pub model: Option<EnqueueImageTo3dObjectModel>,

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

#[derive(Deserialize, Debug, Copy, Clone)]
#[serde(rename_all = "snake_case")]
pub enum EnqueueImageTo3dObjectModel {
  #[deprecated(note="Use `hunyuan_3d_2_0` instead")]
  #[serde(rename = "hunyuan_3d_2")]
  Hunyuan3d2,
  #[serde(rename = "hunyuan_3d_2_0")]
  Hunyuan3d2_0,
  #[serde(rename = "hunyuan_3d_2_1")]
  Hunyuan3d2_1,
  #[serde(rename = "hunyuan_3d_3")]
  Hunyuan3d3,
}

#[derive(Serialize)]
pub struct EnqueueImageTo3dObjectSuccessResponse {
}

impl SerializeMarker for EnqueueImageTo3dObjectSuccessResponse {}

#[derive(Serialize, Debug)]
#[serde(rename_all = "snake_case")]
pub enum EnqueueImageTo3dObjectErrorType {
  /// Caller didn't specify a model
  ModelNotSpecified,
  /// No model available for object generation
  NoProviderAvailable,
  /// Generic server error
  ServerError,
  /// No Fal API key available
  NeedsFalApiKey,
  /// Fal had an API error
  FalError,
  /// Needs to be logged into Artcraft
  NeedsStorytellerCredentials,
}

#[tauri::command]
pub async fn enqueue_image_to_3d_object_command(
  app: AppHandle,
  request: EnqueueImageTo3dObjectRequest,
  app_env_configs: State<'_, AppEnvConfigs>,
  app_data_root: State<'_, AppDataRoot>,
  artcraft_usage_tracker: State<'_, ArtcraftUsageTracker>,
  provider_priority_store: State<'_, ProviderPriorityStore>,
  task_database: State<'_, TaskDatabase>,
  storyteller_creds_manager: State<'_, StorytellerCredentialManager>,
  sora_task_queue: State<'_, SoraTaskQueue>,
) -> Response<EnqueueImageTo3dObjectSuccessResponse, EnqueueImageTo3dObjectErrorType, ()> {

  info!("enqueue_image_to_3d_object_command called");

  let result = handle_request(
    request,
    &app,
    &app_env_configs,
    &app_data_root,
    &artcraft_usage_tracker,
    &provider_priority_store,
    &task_database,
    &storyteller_creds_manager,
  ).await;

  match result {
    Err(err) => {
      error!("error: {:?}", err);
      
      notify_frontend_of_errors(&app, &err).await;

      let mut status = CommandErrorStatus::ServerError;
      let mut error_type = EnqueueImageTo3dObjectErrorType::ServerError;
      let mut error_message = "A server error occurred. Please try again. If it continues, please tell our staff about the problem.";

      match err {
        GenerateError::BadInput(BadInputReason::NoModelSpecified) => {
          status = CommandErrorStatus::BadRequest;
          error_type = EnqueueImageTo3dObjectErrorType::ModelNotSpecified;
          error_message = "No model specified for object generation";
        }
        GenerateError::NoProviderAvailable => {
          status = CommandErrorStatus::ServerError;
          error_type = EnqueueImageTo3dObjectErrorType::NoProviderAvailable;
          error_message = "No configured provider available for object generation";
        }
        GenerateError::MissingCredentials(MissingCredentialsReason::NeedsFalApiKey) => {
          status = CommandErrorStatus::Unauthorized;
          error_type = EnqueueImageTo3dObjectErrorType::NeedsFalApiKey;
          error_message = "You need to set a FAL api key";
        },
        GenerateError::MissingCredentials(MissingCredentialsReason::NeedsStorytellerCredentials) => {
          status = CommandErrorStatus::Unauthorized;
          error_type = EnqueueImageTo3dObjectErrorType::NeedsStorytellerCredentials;
          error_message = "You need to be logged into Artcraft.";
        }
        _ => {}, // Fall-through
      }

      Err(CommandErrorResponseWrapper {
        status,
        error_message: Some(error_message.to_string()),
        error_type: Some(error_type),
        error_details: None,
      })
    }
    Ok(event) => {
      let event = GenerationEnqueueSuccessEvent {
        action: event.to_frontend_event_action(),
        service: event.to_frontend_event_service(),
        model: event.model,
      };

      if let Err(err) = event.send(&app) {
        error!("Failed to emit event: {:?}", err); // Fail open.
      }
      
      CreditsBalanceChangedEvent{}.send_infallible(&app);
      
      Ok(EnqueueImageTo3dObjectSuccessResponse {}.into())
    }
  }
}


pub async fn handle_request(
  request: EnqueueImageTo3dObjectRequest,
  app: &AppHandle,
  app_env_configs: &AppEnvConfigs,
  app_data_root: &AppDataRoot,
  artcraft_usage_tracker: &ArtcraftUsageTracker,
  provider_priority_store: &ProviderPriorityStore,
  task_database: &TaskDatabase,
  storyteller_creds_manager: &StorytellerCredentialManager,
) -> Result<TaskEnqueueSuccess, GenerateError> {

  let result = handle_artcraft_object(
    &request,
    &app,
    &app_env_configs,
    &app_data_root,
    &storyteller_creds_manager,
  ).await;
  
  let success_event = match result {
    Err(err) => return Err(err),
    Ok(event) => event,
  };

  let result = success_event
      .insert_into_task_database_with_frontend_payload(
        task_database,
        request.frontend_caller.clone(),
        request.frontend_subscriber_id.as_deref(),
        request.frontend_subscriber_payload.as_deref(),
      )
      .await;

  if let Err(err) = result {
    error!("Failed to create task in database: {:?}", err);
    // NB: Fail open, but find a way to flag this.
  }

  if let Err(err) = artcraft_usage_tracker.record_object_generation(1, ArtcraftUsageType::ImageToResult, ArtcraftUsagePage::ObjectPage) {
    // NB: Fail open.
    warn!("Failed to report usage: {:?}", err);
  }

  Ok(success_event)
}
