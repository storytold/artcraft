use crate::core::commands::enqueue::common::notify_frontend_of_errors::notify_frontend_of_errors;
use crate::core::commands::enqueue::generate_error::{BadInputReason, GenerateError, MissingCredentialsReason, ProviderFailureReason};
use crate::core::commands::enqueue::image_to_video::artcraft::handle_artcraft_video::handle_video_artcraft;
use crate::core::commands::enqueue::image_to_video::grok::handle_grok_video::handle_grok_video;
use crate::core::commands::enqueue::image_to_video::sora2::handle_sora_sora2::handle_sora_sora2;
use crate::core::commands::enqueue::task_enqueue_success::TaskEnqueueSuccess;
use crate::core::commands::enqueue::text_to_image::enqueue_text_to_image_command::TextToImageModel;
use crate::core::commands::response::failure_response_wrapper::{CommandErrorResponseWrapper, CommandErrorStatus};
use crate::core::commands::response::shorthand::Response;
use crate::core::commands::response::success_response_wrapper::SerializeMarker;
use crate::core::events::basic_sendable_event_trait::BasicSendableEvent;
use crate::core::events::functional_events::credits_balance_changed_event::CreditsBalanceChangedEvent;
use crate::core::events::generation_events::common::GenerationAction;
use crate::core::events::generation_events::generation_enqueue_failure_event::GenerationEnqueueFailureEvent;
use crate::core::events::generation_events::generation_enqueue_success_event::GenerationEnqueueSuccessEvent;
use crate::core::state::app_env_configs::app_env_configs::AppEnvConfigs;
use crate::core::state::artcraft_usage_tracker::artcraft_usage_tracker::ArtcraftUsageTracker;
use crate::core::state::data_dir::app_data_root::AppDataRoot;
use crate::core::state::provider_priority::{Provider, ProviderPriorityStore};
use crate::core::state::task_database::TaskDatabase;
use crate::services::grok::state::grok_credential_manager::GrokCredentialManager;
use crate::services::sora::state::sora_credential_manager::SoraCredentialManager;
use crate::services::sora::state::sora_task_queue::SoraTaskQueue;
use crate::services::storyteller::state::storyteller_credential_manager::StorytellerCredentialManager;
use artcraft_router::api::common_aspect_ratio::CommonAspectRatio;
use enums::common::generation_provider::GenerationProvider;
use enums::tauri::ux::tauri_command_caller::TauriCommandCaller;
use log::{error, info, warn};
use serde_derive::{Deserialize, Serialize};
use tauri::{AppHandle, State};
use tokens::tokens::media_files::MediaFileToken;
use crate::core::state::artcraft_usage_tracker::artcraft_usage_type::{ArtcraftUsagePage, ArtcraftUsageType};

/// This is used in the Tauri command bridge.
/// Don't change the serializations without coordinating with the frontend.
#[derive(Deserialize, Debug, Copy, Clone)]
#[serde(rename_all = "snake_case")]
pub enum VideoModel {
  #[serde(rename = "grok_video")]
  GrokVideo,
  
  #[serde(rename = "kling_1.6_pro")]
  Kling16Pro,

  #[serde(rename = "kling_2.1_pro")]
  Kling21Pro,

  #[serde(rename = "kling_2.1_master")]
  Kling21Master,

  #[serde(rename = "kling_2p5_turbo_pro")]
  Kling2p5TurboPro,

  #[serde(rename = "kling_2p6_pro")]
  Kling2p6Pro,

  #[serde(rename = "seedance_1.0_lite")]
  Seedance10Lite,

  #[serde(rename = "seedance_2p0")]
  Seedance2p0,

  #[serde(rename = "sora_2")]
  Sora2,

  #[serde(rename = "sora_2_pro")]
  Sora2Pro,

  #[serde(rename = "veo_2")]
  Veo2,

  #[serde(rename = "veo_3")]
  Veo3,

  #[serde(rename = "veo_3_fast")]
  Veo3Fast,

  #[serde(rename = "veo_3p1")]
  Veo3p1,

  #[serde(rename = "veo_3p1_fast")]
  Veo3p1Fast,
}

#[derive(Deserialize, Debug)]
pub struct EnqueueImageToVideoRequest {
  /// The provider to use (defaults to Artcraft/Storyteller).
  /// Not all (provider, model) combinations are valid.
  pub provider: Option<GenerationProvider>,

  /// REQUIRED.
  /// The model to use.
  pub model: Option<VideoModel>,

  /// Currently REQUIRED by some downstream models.
  /// Image media file; the starting frame of the video.
  /// TODO: In the future we may support base64 images, URLs, or file paths here.
  pub image_media_token: Option<MediaFileToken>,

  /// Optional.
  /// Image media file; the image to remove the background from.
  /// TODO: In the future we may support base64 images, URLs, or file paths here.
  pub end_frame_image_media_token: Option<MediaFileToken>,

  /// OPTIONAL.
  /// Reference images for the video generation (e.g. character consistency, props, etc.)
  pub reference_image_media_tokens: Option<Vec<MediaFileToken>>,

  /// Optional.
  /// Text prompt used to direct the video.
  pub prompt: Option<String>,

  /// Optional.
  /// Generate the video with audio, if there is an option.
  /// Typically, this costs money when presented as an option, so we default to off.
  pub generate_audio: Option<bool>,

  /// OPTIONAL.
  /// Aspect ratio for the generated video.
  pub aspect_ratio: Option<CommonAspectRatio>,

  /// OPTIONAL.
  /// Duration of the generated video in seconds.
  pub duration_seconds: Option<u16>,

  /// OPTIONAL.
  /// Number of videos to generate in one batch.
  pub video_batch_count: Option<u16>,

  /// OPTIONAL.
  /// Only for Sora2 model currently.
  pub sora_orientation: Option<SoraOrientation>,

  /// OPTIONAL.
  /// Only for Grok model currently
  pub grok_aspect_ratio: Option<GrokAspectRatio>,

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

// TODO: Not sure how to handle so many different types of video (model) x (services).
#[derive(Deserialize, Debug)]
#[serde(rename_all = "snake_case")]
pub enum SoraOrientation {
  Portrait,
  Landscape,
}

// TODO: Not sure how to handle so many different types of video (model) x (services).
#[derive(Deserialize, Debug)]
#[serde(rename_all = "snake_case")]
pub enum GrokAspectRatio {
  Portrait,
  Landscape,
  Square
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
  request: EnqueueImageToVideoRequest,
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
) -> Response<EnqueueImageToVideoSuccessResponse, EnqueueImageToVideoErrorType, ()> {

  info!("enqueue_image_to_video_command called, request: {:?}", request);

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
      let mut error_type = EnqueueImageToVideoErrorType::ServerError;
      let mut error_message = "A server error occurred. Please try again. If it continues, please tell our staff about the problem.";

      match err {
        GenerateError::BadInput(BadInputReason::NoModelSpecified) => {
          status = CommandErrorStatus::BadRequest;
          error_type = EnqueueImageToVideoErrorType::ModelNotSpecified;
          error_message = "No model specified for video generation";
        }
        GenerateError::NoProviderAvailable => {
          status = CommandErrorStatus::ServerError;
          error_type = EnqueueImageToVideoErrorType::NoProviderAvailable;
          error_message = "No configured provider available for video generation";
        }
        GenerateError::MissingCredentials(MissingCredentialsReason::NeedsFalApiKey) => {
          status = CommandErrorStatus::Unauthorized;
          error_type = EnqueueImageToVideoErrorType::NeedsFalApiKey;
          error_message = "You need to set a FAL api key";
        },
        GenerateError::MissingCredentials(MissingCredentialsReason::NeedsStorytellerCredentials) => {
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

      CreditsBalanceChangedEvent{}.send_infallible(&app);
      
      Ok(EnqueueImageToVideoSuccessResponse {}.into())
    }
  }
}


pub async fn handle_request(
  request: EnqueueImageToVideoRequest,
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
    (VideoModel::GrokVideo, _) => GenerationProvider::Grok,
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
    // NB: Fail open, but find a way to flag this.
  }

  if let Err(err) = artcraft_usage_tracker.record_video_generation(1, ArtcraftUsageType::ImageToResult, ArtcraftUsagePage::VideoPage) {
    // NB: Fail open.
    warn!("Failed to report usage: {:?}", err);
  }

  Ok(success_event)
}
