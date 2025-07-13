use crate::core::commands::enqueue::image::generic::handle_image_artcraft::handle_image_artcraft;
use crate::core::commands::enqueue::image::generic::handle_image_fal::handle_image_fal;
use crate::core::commands::enqueue::image::gpt_image_1::handle_image_sora::handle_image_sora;
use crate::core::commands::enqueue::image::internal_image_error::InternalImageError;
use crate::core::commands::enqueue::task_enqueue_success::TaskEnqueueSuccess;
use crate::core::commands::response::failure_response_wrapper::{CommandErrorResponseWrapper, CommandErrorStatus};
use crate::core::commands::response::shorthand::Response;
use crate::core::commands::response::success_response_wrapper::SerializeMarker;
use crate::core::events::basic_sendable_event_trait::BasicSendableEvent;
use crate::core::events::generation_events::common::{GenerationAction, GenerationServiceProvider};
use crate::core::events::generation_events::generation_enqueue_success_event::GenerationEnqueueSuccessEvent;
use crate::core::events::sendable_event_trait::SendableEvent;
use crate::core::model::image_models::ImageModel;
use crate::core::state::app_env_configs::app_env_configs::AppEnvConfigs;
use crate::core::state::data_dir::app_data_root::AppDataRoot;
use crate::core::state::provider_priority::{Provider, ProviderPriorityStore};
use crate::core::state::task_database::TaskDatabase;
use crate::services::fal::state::fal_credential_manager::FalCredentialManager;
use crate::services::fal::state::fal_task_queue::FalTaskQueue;
use crate::services::sora::state::sora_credential_manager::SoraCredentialManager;
use crate::services::sora::state::sora_task_queue::SoraTaskQueue;
use crate::services::storyteller::state::storyteller_credential_manager::StorytellerCredentialManager;
use enums::common::generation_provider::GenerationProvider;
use enums::tauri::tasks::task_status::TaskStatus;
use enums::tauri::tasks::task_type::TaskType;
use fal_client::requests::queue::image_gen::enqueue_flux_pro_11_ultra_text_to_image::{enqueue_flux_pro_11_ultra_text_to_image, FluxPro11UltraTextToImageArgs};
use log::{error, info, warn};
use serde::{Deserialize, Serialize};
use sqlite_tasks::queries::create_task::{create_task, CreateTaskArgs};
use tauri::{AppHandle, State};

#[derive(Deserialize)]
pub struct EnqueueTextToImageRequest {
  /// Text prompt for the image generation. Required.
  pub prompt: Option<String>,

  /// The model to use.
  pub model: Option<ImageModel>,
}


#[derive(Serialize)]
pub struct EnqueueTextToImageSuccessResponse {
}

impl SerializeMarker for EnqueueTextToImageSuccessResponse {}

#[derive(Serialize, Debug)]
#[serde(rename_all = "snake_case")]
pub enum EnqueueTextToImageErrorType {
  /// Caller didn't specify a model
  ModelNotSpecified,
  /// No model available for image generation
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
pub async fn enqueue_text_to_image_command(
  app: AppHandle,
  request: EnqueueTextToImageRequest,
  app_data_root: State<'_, AppDataRoot>,
  app_env_configs: State<'_, AppEnvConfigs>,
  provider_priority_store: State<'_, ProviderPriorityStore>,
  task_database: State<'_, TaskDatabase>,
  fal_creds_manager: State<'_, FalCredentialManager>,
  storyteller_creds_manager: State<'_, StorytellerCredentialManager>,
  fal_task_queue: State<'_, FalTaskQueue>,
  sora_creds_manager: State<'_, SoraCredentialManager>,
  sora_task_queue: State<'_, SoraTaskQueue>,
) -> Response<EnqueueTextToImageSuccessResponse, EnqueueTextToImageErrorType, ()> {

  info!("enqueue_text_to_image called");

  let result = handle_request(
    &app,
    request,
    &app_data_root,
    &provider_priority_store,
    &task_database,
    &fal_creds_manager,
    &storyteller_creds_manager,
    &app_env_configs,
    &fal_task_queue,
    &sora_creds_manager,
    &sora_task_queue,
  ).await;

  match result {
    Err(err) => {
      error!("error: {:?}", err);

      let mut status = CommandErrorStatus::ServerError;
      let mut error_type = EnqueueTextToImageErrorType::ServerError;
      let mut error_message = "A server error occurred. Please try again. If it continues, please tell our staff about the problem.";

      match err {
        InternalImageError::NoModelSpecified => {
          status = CommandErrorStatus::BadRequest;
          error_type = EnqueueTextToImageErrorType::ModelNotSpecified;
          error_message = "No model specified for image generation";
        }
        InternalImageError::NoProviderAvailable => {
          status = CommandErrorStatus::ServerError;
          error_type = EnqueueTextToImageErrorType::NoProviderAvailable;
          error_message = "No configured provider available for image generation";
        }
        InternalImageError::NeedsFalApiKey => {
          status = CommandErrorStatus::Unauthorized;
          error_type = EnqueueTextToImageErrorType::NeedsFalApiKey;
          error_message = "You need to set a FAL api key";
        },
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

      Ok(EnqueueTextToImageSuccessResponse {}.into())
    }
  }
}


pub async fn handle_request(
  app: &AppHandle,
  request: EnqueueTextToImageRequest,
  app_data_root: &AppDataRoot,
  provider_priority_store: &ProviderPriorityStore,
  task_database: &TaskDatabase,
  fal_creds_manager: &FalCredentialManager,
  storyteller_creds_manager: &StorytellerCredentialManager,
  app_env_configs: &AppEnvConfigs,
  fal_task_queue: &FalTaskQueue,
  sora_creds_manager: &SoraCredentialManager,
  sora_task_queue: &SoraTaskQueue,
) -> Result<TaskEnqueueSuccess, InternalImageError> {
  
  let result = dispatch_request(
    &app,
    request,
    &app_data_root,
    &provider_priority_store,
    &fal_creds_manager,
    &storyteller_creds_manager,
    &app_env_configs,
    &fal_task_queue,
    &sora_creds_manager,
    &sora_task_queue,
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

pub async fn dispatch_request(
  app: &AppHandle,
  request: EnqueueTextToImageRequest,
  app_data_root: &AppDataRoot,
  provider_priority_store: &ProviderPriorityStore,
  fal_creds_manager: &FalCredentialManager,
  storyteller_creds_manager: &StorytellerCredentialManager,
  app_env_configs: &AppEnvConfigs,
  fal_task_queue: &FalTaskQueue,
  sora_creds_manager: &SoraCredentialManager,
  sora_task_queue: &SoraTaskQueue,
) -> Result<TaskEnqueueSuccess, InternalImageError> {

  match request.model {
    None => {
      return Err(InternalImageError::NoModelSpecified);
    }
    Some(ImageModel::GptImage1) => {
      return handle_image_sora(&app, request, sora_creds_manager, sora_task_queue).await;
    }
    _ => {
      // Fall-through
    }
  };

  let priority = provider_priority_store.get_priority()?;
  
  for provider in priority.iter() {
    match provider {
      Provider::Sora => {} // Fallthrough
      Provider::Artcraft => {
        return handle_image_artcraft(
          request, &app, app_env_configs, app_data_root, storyteller_creds_manager).await;
      }
      Provider::Fal => {
        if fal_creds_manager.has_apparent_api_token()? {
          return handle_image_fal(&app, request, fal_creds_manager, fal_task_queue).await;
        }
      }
    }
  }
  
  Err(InternalImageError::NoProviderAvailable)
}
