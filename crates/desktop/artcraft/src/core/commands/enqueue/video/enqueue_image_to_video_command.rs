use crate::core::commands::enqueue::task_enqueue_success::TaskEnqueueSuccess;
use crate::core::commands::enqueue::video::generic::handle_video::handle_video;
use crate::core::commands::enqueue::video::internal_video_error::InternalVideoError;
use crate::core::commands::response::failure_response_wrapper::{CommandErrorResponseWrapper, CommandErrorStatus};
use crate::core::commands::response::shorthand::Response;
use crate::core::commands::response::success_response_wrapper::SerializeMarker;
use crate::core::events::basic_sendable_event_trait::BasicSendableEvent;
use crate::core::events::generation_events::generation_enqueue_success_event::GenerationEnqueueSuccessEvent;
use crate::core::model::video_models::VideoModel;
use crate::core::state::app_env_configs::app_env_configs::AppEnvConfigs;
use crate::core::state::data_dir::app_data_root::AppDataRoot;
use crate::core::state::provider_priority::{Provider, ProviderPriorityStore};
use crate::core::state::task_database::TaskDatabase;
use crate::services::fal::state::fal_credential_manager::FalCredentialManager;
use crate::services::fal::state::fal_task_queue::FalTaskQueue;
use crate::services::sora::state::sora_task_queue::SoraTaskQueue;
use crate::services::storyteller::state::storyteller_credential_manager::StorytellerCredentialManager;
use fal_client::requests::queue::image_gen::enqueue_flux_pro_11_ultra_text_to_image::{enqueue_flux_pro_11_ultra_text_to_image, FluxPro11UltraTextToImageArgs};
use log::{error, info, warn};
use serde_derive::{Deserialize, Serialize};
use tauri::{AppHandle, State};
use tokens::tokens::media_files::MediaFileToken;

#[derive(Deserialize)]
pub struct EnqueueImageToVideoRequest {
  /// Image media file; the image to remove the background from.
  /// TODO: In the future we may support base64 images, URLs, or file paths here.
  pub image_media_token: Option<MediaFileToken>,
  
  /// The model to use.
  pub model: Option<VideoModel>,
}

#[derive(Serialize)]
pub struct EnqueueImageToVideoSuccessResponse {
}

impl SerializeMarker for EnqueueImageToVideoSuccessResponse {}

#[derive(Serialize, Debug)]
#[serde(rename_all = "snake_case")]
pub enum EnqueueImageToVideoErrorType {
  /// Caller didn't specify a model
  ModelNotSpecified,
  /// No model available for video generation
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
pub async fn enqueue_image_to_video_command(
  app: AppHandle,
  request: EnqueueImageToVideoRequest,
  app_env_configs: State<'_, AppEnvConfigs>,
  app_data_root: State<'_, AppDataRoot>,
  provider_priority_store: State<'_, ProviderPriorityStore>,
  task_database: State<'_, TaskDatabase>,
  fal_creds_manager: State<'_, FalCredentialManager>,
  fal_task_queue: State<'_, FalTaskQueue>,
  storyteller_creds_manager: State<'_, StorytellerCredentialManager>,
  sora_task_queue: State<'_, SoraTaskQueue>,
) -> Response<EnqueueImageToVideoSuccessResponse, EnqueueImageToVideoErrorType, ()> {

  info!("enqueue_image_to_video_command called");

  let result = handle_request(
    request,
    &app,
    &app_env_configs,
    &app_data_root,
    &provider_priority_store,
    &task_database,
    &fal_creds_manager,
    &storyteller_creds_manager,
    &fal_task_queue,
  ).await;

  match result {
    Err(err) => {
      error!("error: {:?}", err);

      let mut status = CommandErrorStatus::ServerError;
      let mut error_type = EnqueueImageToVideoErrorType::ServerError;
      let mut error_message = "A server error occurred. Please try again. If it continues, please tell our staff about the problem.";

      match err {
        InternalVideoError::NoModelSpecified => {
          status = CommandErrorStatus::BadRequest;
          error_type = EnqueueImageToVideoErrorType::ModelNotSpecified;
          error_message = "No model specified for video generation";
        }
        InternalVideoError::NoProviderAvailable => {
          status = CommandErrorStatus::ServerError;
          error_type = EnqueueImageToVideoErrorType::NoProviderAvailable;
          error_message = "No configured provider available for video generation";
        }
        InternalVideoError::NeedsFalApiKey => {
          status = CommandErrorStatus::Unauthorized;
          error_type = EnqueueImageToVideoErrorType::NeedsFalApiKey;
          error_message = "You need to set a FAL api key";
        },
        InternalVideoError::NeedsStorytellerCredentials => {
          status = CommandErrorStatus::Unauthorized;
          error_type = EnqueueImageToVideoErrorType::NeedsStorytellerCredentials;
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
      
      Ok(EnqueueImageToVideoSuccessResponse {}.into())
    }
  }
}


pub async fn handle_request(
  request: EnqueueImageToVideoRequest,
  app: &AppHandle,
  app_env_configs: &AppEnvConfigs,
  app_data_root: &AppDataRoot,
  provider_priority_store: &ProviderPriorityStore,
  task_database: &TaskDatabase,
  fal_creds_manager: &FalCredentialManager,
  storyteller_creds_manager: &StorytellerCredentialManager,
  fal_task_queue: &FalTaskQueue,
) -> Result<TaskEnqueueSuccess, InternalVideoError> {

  let result = handle_video(
    request,
    &app,
    &app_env_configs,
    &app_data_root,
    &provider_priority_store,
    &fal_creds_manager,
    &storyteller_creds_manager,
    &fal_task_queue,
  ).await;

  let success_event = match result {
    Err(err) => return Err(err),
    Ok(event) => event,
  };

  let result = success_event
      .insert_into_task_database(task_database)
      .await;

  if let Err(err) = result {
    error!("Failed to create task in database: {:?}", err);
    // NB: Fail open, but find a way to flag this.
  }

  Ok(success_event)
}
