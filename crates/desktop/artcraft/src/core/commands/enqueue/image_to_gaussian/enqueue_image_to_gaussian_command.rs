use crate::core::commands::enqueue::common::notify_frontend_of_errors::notify_frontend_of_errors;
use crate::core::commands::enqueue::generate_error::{BadInputReason, GenerateError, MissingCredentialsReason};
use crate::core::commands::enqueue::image_to_gaussian::artcraft::handle_artcraft_gaussian::handle_gaussian_artcraft;
use crate::core::commands::enqueue::image_to_gaussian::worldlabs::handle_worldlabs_marble::handle_worldlabs_marble;
use crate::core::commands::enqueue::task_enqueue_success::TaskEnqueueSuccess;
use crate::core::commands::response::failure_response_wrapper::{CommandErrorResponseWrapper, CommandErrorStatus};
use crate::core::commands::response::shorthand::Response;
use crate::core::commands::response::success_response_wrapper::SerializeMarker;
use crate::core::events::basic_sendable_event_trait::BasicSendableEvent;
use crate::core::events::functional_events::credits_balance_changed_event::CreditsBalanceChangedEvent;
use crate::core::events::generation_events::common::{GenerationAction, GenerationServiceProvider};
use crate::core::events::generation_events::generation_enqueue_success_event::GenerationEnqueueSuccessEvent;
use crate::core::events::sendable_event_trait::SendableEvent;
use crate::core::state::app_env_configs::app_env_configs::AppEnvConfigs;
use crate::core::state::data_dir::app_data_root::AppDataRoot;
use crate::core::state::provider_priority::{Provider, ProviderPriorityStore};
use crate::core::state::task_database::TaskDatabase;
use crate::services::grok::state::grok_credential_manager::GrokCredentialManager;
use crate::services::grok::state::grok_image_prompt_queue::GrokImagePromptQueue;
use crate::services::midjourney::state::midjourney_credential_manager::MidjourneyCredentialManager;
use crate::services::sora::state::sora_credential_manager::SoraCredentialManager;
use crate::services::sora::state::sora_task_queue::SoraTaskQueue;
use crate::services::storyteller::state::storyteller_credential_manager::StorytellerCredentialManager;
use crate::services::worldlabs::state::worldlabs_credential_manager::WorldlabsCredentialManager;
use enums::common::generation_provider::GenerationProvider;
use enums::tauri::tasks::task_status::TaskStatus;
use enums::tauri::tasks::task_type::TaskType;
use enums::tauri::ux::tauri_command_caller::TauriCommandCaller;
use log::{error, info, warn};
use serde::{Deserialize, Serialize};
use sqlite_tasks::queries::create_task::{create_task, CreateTaskArgs};
use tauri::{AppHandle, State};
use tokens::tokens::media_files::MediaFileToken;
use crate::core::state::artcraft_usage_tracker::artcraft_usage_tracker::ArtcraftUsageTracker;
use crate::core::state::artcraft_usage_tracker::artcraft_usage_type::{ArtcraftUsagePage, ArtcraftUsageType};

/// This is used in the Tauri command bridge.
/// Don't change the serializations without coordinating with the frontend.
#[derive(Deserialize, Debug, Copy, Clone)]
#[serde(rename_all = "snake_case")]
pub enum GaussianModel {
  #[serde(rename = "world_labs_marble")]
  WorldLabsMarble,

  #[serde(rename = "marble_0p1_mini")]
  Marble0p1Mini,

  #[serde(rename = "marble_0p1_plus")]
  Marble0p1Plus,
}

#[derive(Deserialize)]
pub struct EnqueueImageToGaussianRequest {
  /// REQUIRED.
  /// The model to use.
  pub model: Option<GaussianModel>,

  /// OPTIONAL.
  /// The provider to use (defaults to Artcraft/Storyteller).
  /// Not all (provider, model) combinations are valid.
  pub provider: Option<GenerationProvider>,

  /// OPTIONAL.
  /// Text prompt for the gaussian generation. Required.
  pub prompt: Option<String>,

  /// OPTIONAL.
  /// Images for the gaussian generation
  pub image_media_tokens: Option<Vec<MediaFileToken>>,

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


#[derive(Serialize)]
pub struct EnqueueImageToGaussianSuccessResponse {
}

impl SerializeMarker for EnqueueImageToGaussianSuccessResponse {}

#[derive(Serialize, Debug)]
#[serde(rename_all = "snake_case")]
pub enum EnqueueImageToGaussianErrorType {
  /// Caller didn't specify a model
  ModelNotSpecified,
  /// No model available for image generation
  NoProviderAvailable,
  /// Generic server error
  ServerError,
  /// Needs to be logged into Artcraft
  NeedsStorytellerCredentials,
}


#[tauri::command]
pub async fn enqueue_image_to_gaussian_command(
  request: EnqueueImageToGaussianRequest,
  app: AppHandle,
  app_data_root: State<'_, AppDataRoot>,
  app_env_configs: State<'_, AppEnvConfigs>,
  artcraft_usage_tracker: State<'_, ArtcraftUsageTracker>,
  task_database: State<'_, TaskDatabase>,
  storyteller_creds_manager: State<'_, StorytellerCredentialManager>,
  worldlabs_creds_manager: State<'_, WorldlabsCredentialManager>,
) -> Response<EnqueueImageToGaussianSuccessResponse, EnqueueImageToGaussianErrorType, ()> {

  info!("enqueue_image_to_gaussian called");

  let result = handle_request(
    request,
    &app,
    &app_data_root,
    &artcraft_usage_tracker,
    &task_database,
    &storyteller_creds_manager,
    &worldlabs_creds_manager,
    &app_env_configs,
  ).await;

  match result {
    Err(err) => {
      error!("error: {:?}", err);

      notify_frontend_of_errors(&app, &err).await;

      let mut status = CommandErrorStatus::ServerError;
      let mut error_type = EnqueueImageToGaussianErrorType::ServerError;
      let mut error_message = "A server error occurred. Please try again. If it continues, please tell our staff about the problem.";

      match err {
        GenerateError::BadInput(BadInputReason::NoModelSpecified) => {
          status = CommandErrorStatus::BadRequest;
          error_type = EnqueueImageToGaussianErrorType::ModelNotSpecified;
          error_message = "No model specified for image generation";
        }
        GenerateError::NoProviderAvailable => {
          status = CommandErrorStatus::ServerError;
          error_type = EnqueueImageToGaussianErrorType::NoProviderAvailable;
          error_message = "No configured provider available for image generation";
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

      Ok(EnqueueImageToGaussianSuccessResponse {}.into())
    }
  }
}


pub async fn handle_request(
  request: EnqueueImageToGaussianRequest,
  app: &AppHandle,
  app_data_root: &AppDataRoot,
  artcraft_usage_tracker: &ArtcraftUsageTracker,
  task_database: &TaskDatabase,
  storyteller_creds_manager: &StorytellerCredentialManager,
  worldlabs_creds_manager: &WorldlabsCredentialManager,
  app_env_configs: &AppEnvConfigs,
) -> Result<TaskEnqueueSuccess, GenerateError> {
  
  let result = dispatch_request(
    &request,
    &app,
    &app_data_root,
    &storyteller_creds_manager,
    &worldlabs_creds_manager,
    &app_env_configs,
  ).await;
  
  let success_event = match result {
    Err(err) => return Err(err),
    Ok(event) => event,
  };

  let result = success_event
      .insert_into_task_database_with_frontend_payload(
        task_database,
        request.frontend_caller,
        request.frontend_subscriber_id.as_deref(),
        request.frontend_subscriber_payload.as_deref(),
      )
      .await;

  if let Err(err) = result {
    error!("Failed to create task in database: {:?}", err);
    // NB: Fail open, but find a way to flag this.
  }

  if let Err(err) = artcraft_usage_tracker.record_object_generation(1, ArtcraftUsageType::ImageToResult, ArtcraftUsagePage::OtherPage) {
    // NB: Fail open.
    warn!("Failed to report usage: {:?}", err);
  }

  Ok(success_event)
}

pub async fn dispatch_request(
  request: &EnqueueImageToGaussianRequest,
  app: &AppHandle,
  app_data_root: &AppDataRoot,
  storyteller_creds_manager: &StorytellerCredentialManager,
  worldlabs_creds_manager: &WorldlabsCredentialManager,
  app_env_configs: &AppEnvConfigs,
) -> Result<TaskEnqueueSuccess, GenerateError> {

  if request.model.is_none() {
    return Err(GenerateError::BadInput(BadInputReason::NoModelSpecified));
  }

  let provider = request.provider.unwrap_or(GenerationProvider::Artcraft);

  match provider {
    GenerationProvider::WorldLabs => {
      handle_worldlabs_marble(
        app,
        app_data_root,
        app_env_configs,
        request,
        worldlabs_creds_manager,
      ).await
    }
    GenerationProvider::Artcraft => {
      handle_gaussian_artcraft(
        request,
        app,
        app_env_configs,
        storyteller_creds_manager,
      ).await
    }
    _ => {
      Err(GenerateError::NoProviderAvailable)
    }
  }
}
