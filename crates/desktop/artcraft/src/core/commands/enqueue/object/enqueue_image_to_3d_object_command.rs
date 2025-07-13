use crate::core::commands::enqueue::object::generic::handle_object::handle_object;
use crate::core::commands::enqueue::object::internal_object_error::InternalObjectError;
use crate::core::commands::enqueue::task_enqueue_success::TaskEnqueueSuccess;
use crate::core::commands::response::failure_response_wrapper::{CommandErrorResponseWrapper, CommandErrorStatus};
use crate::core::commands::response::shorthand::Response;
use crate::core::commands::response::success_response_wrapper::SerializeMarker;
use crate::core::state::app_env_configs::app_env_configs::AppEnvConfigs;
use crate::core::state::data_dir::app_data_root::AppDataRoot;
use crate::core::state::provider_priority::{Provider, ProviderPriorityStore};
use crate::services::fal::state::fal_credential_manager::FalCredentialManager;
use crate::services::fal::state::fal_task_queue::FalTaskQueue;
use crate::services::sora::state::sora_task_queue::SoraTaskQueue;
use crate::services::storyteller::state::storyteller_credential_manager::StorytellerCredentialManager;
use fal_client::requests::queue::image_gen::enqueue_flux_pro_11_ultra_text_to_image::{enqueue_flux_pro_11_ultra_text_to_image, FluxPro11UltraTextToImageArgs};
use log::{error, info, warn};
use serde_derive::{Deserialize, Serialize};
use tauri::{AppHandle, State};
use tokens::tokens::media_files::MediaFileToken;
use crate::core::events::basic_sendable_event_trait::BasicSendableEvent;
use crate::core::events::generation_events::generation_enqueue_success_event::GenerationEnqueueSuccessEvent;
use crate::core::state::task_database::TaskDatabase;

#[derive(Deserialize)]
pub struct EnqueueImageTo3dObjectRequest {
  /// Image media file; the image to remove the background from.
  /// TODO: In the future we may support base64 images, URLs, or file paths here.
  pub image_media_token: Option<MediaFileToken>,
  
  /// The model to use.
  pub model: Option<EnqueueImageTo3dObjectModel>,
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
  provider_priority_store: State<'_, ProviderPriorityStore>,
  task_database: State<'_, TaskDatabase>,
  fal_creds_manager: State<'_, FalCredentialManager>,
  fal_task_queue: State<'_, FalTaskQueue>,
  storyteller_creds_manager: State<'_, StorytellerCredentialManager>,
  sora_task_queue: State<'_, SoraTaskQueue>,
) -> Response<EnqueueImageTo3dObjectSuccessResponse, EnqueueImageTo3dObjectErrorType, ()> {

  info!("enqueue_image_to_3d_object_command called");

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
      let mut error_type = EnqueueImageTo3dObjectErrorType::ServerError;
      let mut error_message = "A server error occurred. Please try again. If it continues, please tell our staff about the problem.";

      match err {
        InternalObjectError::NoModelSpecified => {
          status = CommandErrorStatus::BadRequest;
          error_type = EnqueueImageTo3dObjectErrorType::ModelNotSpecified;
          error_message = "No model specified for object generation";
        }
        InternalObjectError::NoProviderAvailable => {
          status = CommandErrorStatus::ServerError;
          error_type = EnqueueImageTo3dObjectErrorType::NoProviderAvailable;
          error_message = "No configured provider available for object generation";
        }
        InternalObjectError::NeedsFalApiKey => {
          status = CommandErrorStatus::Unauthorized;
          error_type = EnqueueImageTo3dObjectErrorType::NeedsFalApiKey;
          error_message = "You need to set a FAL api key";
        },
        InternalObjectError::NeedsStorytellerCredentials => {
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
      
      Ok(EnqueueImageTo3dObjectSuccessResponse {}.into())
    }
  }
}


pub async fn handle_request(
  request: EnqueueImageTo3dObjectRequest,
  app: &AppHandle,
  app_env_configs: &AppEnvConfigs,
  app_data_root: &AppDataRoot,
  provider_priority_store: &ProviderPriorityStore,
  task_database: &TaskDatabase,
  fal_creds_manager: &FalCredentialManager,
  storyteller_creds_manager: &StorytellerCredentialManager,
  fal_task_queue: &FalTaskQueue,
) -> Result<TaskEnqueueSuccess, InternalObjectError> {

  let result = handle_object(
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
