use crate::core::commands::enqueue::common::notify_frontend_of_errors::notify_frontend_of_errors;
use crate::core::commands::enqueue::generate_error::{BadInputReason, GenerateError, MissingCredentialsReason};
use crate::core::commands::enqueue::task_enqueue_success::TaskEnqueueSuccess;
use crate::core::commands::generate::generate_video::artcraft::handle_artcraft_video::handle_video_artcraft;
use crate::core::commands::generate::generate_video::grok::handle_grok_video::handle_grok_video;
use crate::core::commands::generate::generate_video::request::{
  TauriGenerateVideoErrorType, TauriGenerateVideoRequest, TauriGenerateVideoResponse,
  TauriVideoModel,
};
use crate::core::commands::generate::generate_video::sora2::handle_sora_sora2::handle_sora_sora2;
use crate::core::commands::response::failure_response_wrapper::{CommandErrorResponseWrapper, CommandErrorStatus};
use crate::core::commands::response::shorthand::Response;
use crate::core::events::basic_sendable_event_trait::BasicSendableEvent;
use crate::core::events::functional_events::credits_balance_changed_event::CreditsBalanceChangedEvent;
use crate::core::events::generation_events::generation_enqueue_success_event::GenerationEnqueueSuccessEvent;
use crate::core::state::app_env_configs::app_env_configs::AppEnvConfigs;
use crate::core::state::artcraft_usage_tracker::artcraft_usage_tracker::ArtcraftUsageTracker;
use crate::core::state::artcraft_usage_tracker::artcraft_usage_type::{ArtcraftUsagePage, ArtcraftUsageType};
use crate::core::state::data_dir::app_data_root::AppDataRoot;
use crate::core::state::provider_priority::{Provider, ProviderPriorityStore};
use crate::core::state::task_database::TaskDatabase;
use crate::services::grok::state::grok_credential_manager::GrokCredentialManager;
use crate::services::sora::state::sora_credential_manager::SoraCredentialManager;
use crate::services::sora::state::sora_task_queue::SoraTaskQueue;
use crate::services::storyteller::state::storyteller_credential_manager::StorytellerCredentialManager;
use enums::common::generation_provider::GenerationProvider;
use log::{error, info, warn};
use tauri::{AppHandle, State};

#[tauri::command]
pub async fn generate_video_command(
  mut request: TauriGenerateVideoRequest,
  app: AppHandle,
  app_env_configs: State<'_, AppEnvConfigs>,
  app_data_root: State<'_, AppDataRoot>,
  artcraft_usage_tracker: State<'_, ArtcraftUsageTracker>,
  provider_priority_store: State<'_, ProviderPriorityStore>,
  task_database: State<'_, TaskDatabase>,
  grok_creds_manager: State<'_, GrokCredentialManager>,
  storyteller_creds_manager: State<'_, StorytellerCredentialManager>,
  sora_task_queue: State<'_, SoraTaskQueue>,
  sora_creds_manager: State<'_, SoraCredentialManager>,
) -> Response<TauriGenerateVideoResponse, TauriGenerateVideoErrorType, ()> {

  info!("generate_video_command called, request: {:?}", request);

  if request.image_media_token.is_none()
      && request.start_frame_image_media_token.is_some() {
    // NB: This is to fix the legacy handlers
    request.image_media_token = request.start_frame_image_media_token.clone();
  }

  if request.image_media_token.is_some()
      && request.start_frame_image_media_token.is_none() {
    // NB: This is to fix the modern handlers
    request.start_frame_image_media_token = request.image_media_token.clone();
  }

  let result = handle_request(
    request,
    &app,
    &app_env_configs,
    &app_data_root,
    &artcraft_usage_tracker,
    &provider_priority_store,
    &task_database,
    &grok_creds_manager,
    &sora_creds_manager,
    &storyteller_creds_manager,
  ).await;

  match result {
    Err(err) => {
      error!("error: {:?}", err);

      notify_frontend_of_errors(&app, &err).await;

      let mut status = CommandErrorStatus::ServerError;
      let mut error_type = TauriGenerateVideoErrorType::ServerError;
      let mut error_message = "A server error occurred. Please try again. If it continues, please tell our staff about the problem.";

      match err {
        GenerateError::BadInput(BadInputReason::NoModelSpecified) => {
          status = CommandErrorStatus::BadRequest;
          error_type = TauriGenerateVideoErrorType::ModelNotSpecified;
          error_message = "No model specified for video generation";
        }
        GenerateError::NoProviderAvailable => {
          status = CommandErrorStatus::ServerError;
          error_type = TauriGenerateVideoErrorType::NoProviderAvailable;
          error_message = "No configured provider available for video generation";
        }
        GenerateError::MissingCredentials(MissingCredentialsReason::NeedsFalApiKey) => {
          status = CommandErrorStatus::Unauthorized;
          error_type = TauriGenerateVideoErrorType::NeedsFalApiKey;
          error_message = "You need to set a FAL api key";
        },
        GenerateError::MissingCredentials(MissingCredentialsReason::NeedsStorytellerCredentials) => {
          status = CommandErrorStatus::Unauthorized;
          error_type = TauriGenerateVideoErrorType::NeedsStorytellerCredentials;
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
        error!("Failed to emit event: {:?}", err);
      }

      CreditsBalanceChangedEvent{}.send_infallible(&app);

      Ok(TauriGenerateVideoResponse {}.into())
    }
  }
}

async fn handle_request(
  request: TauriGenerateVideoRequest,
  app: &AppHandle,
  app_env_configs: &AppEnvConfigs,
  app_data_root: &AppDataRoot,
  artcraft_usage_tracker: &ArtcraftUsageTracker,
  provider_priority_store: &ProviderPriorityStore,
  task_database: &TaskDatabase,
  grok_creds_manager: &GrokCredentialManager,
  sora_creds_manager: &SoraCredentialManager,
  storyteller_creds_manager: &StorytellerCredentialManager,
) -> Result<TaskEnqueueSuccess, GenerateError> {

  let model = match request.model {
    Some(model) => model,
    None => {
      return Err(GenerateError::no_model_specified())
    }
  };

  let provider = match (model, request.provider) {
    (TauriVideoModel::GrokVideo, _) => GenerationProvider::Grok,
    _ => request.provider.unwrap_or(GenerationProvider::Artcraft),
  };

  info!("generate video with {:?} via provider {:?}", &model, &provider);

  let result = match provider {
    GenerationProvider::Grok => {
      handle_grok_video(
        &request,
        app,
        app_data_root,
        app_env_configs,
        grok_creds_manager,
      ).await
    }
    GenerationProvider::Sora => {
      handle_sora_sora2(
        &request,
        app,
        app_data_root,
        app_env_configs,
        sora_creds_manager,
      ).await
    }
    _ => {
      handle_video_artcraft(
        &request,
        app,
        app_env_configs,
        storyteller_creds_manager,
      ).await
    }
  };

  let success_event = match result {
    Err(err) => return Err(err),
    Ok(event) => event,
  };

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
  }

  if let Err(err) = artcraft_usage_tracker.record_video_generation(1, ArtcraftUsageType::ImageToResult, ArtcraftUsagePage::VideoPage) {
    warn!("Failed to report usage: {:?}", err);
  }

  Ok(success_event)
}
