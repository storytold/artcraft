use crate::core::api_adapters::aspect_ratio::common_aspect_ratio::CommonAspectRatio;
use crate::core::commands::enqueue::common::notify_frontend_of_errors::notify_frontend_of_errors;
use crate::core::commands::enqueue::generate_error::{BadInputReason, GenerateError};
use crate::core::commands::enqueue::image_edit::artcraft::handle_image_edit_artcraft::handle_image_edit_artcraft;
use crate::core::commands::enqueue::image_edit::image_edit_models::image_edit_model_to_model_type;
use crate::core::commands::enqueue::image_edit::sora::handle_image_edit_sora::handle_image_edit_sora;
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
use crate::core::state::data_dir::app_data_root::AppDataRoot;
use crate::core::state::data_dir::trait_data_subdir::DataSubdir;
use crate::core::state::provider_priority::ProviderPriorityStore;
use crate::core::state::task_database::TaskDatabase;
use crate::core::utils::get_url_file_extension::get_url_file_extension;
use crate::core::utils::simple_http_download::simple_http_download;
use crate::services::sora::state::sora_credential_manager::SoraCredentialManager;
use crate::services::sora::state::sora_task_queue::SoraTaskQueue;
use crate::services::storyteller::state::storyteller_credential_manager::StorytellerCredentialManager;
use enums::common::generation_provider::GenerationProvider;
use enums::tauri::tasks::task_type::TaskType;
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
use crate::core::state::artcraft_usage_tracker::artcraft_usage_tracker::ArtcraftUsageTracker;
use crate::core::state::artcraft_usage_tracker::artcraft_usage_type::{ArtcraftUsagePage, ArtcraftUsageType};

/// This is used in the Tauri command bridge.
/// Don't change the serializations without coordinating with the frontend.
#[derive(Deserialize, Debug, Copy, Clone)]
#[serde(rename_all = "snake_case")]
pub enum ImageEditModel {
  #[serde(rename = "flux_pro_kontext_max")]
  FluxProKontextMax,

  #[serde(rename = "gemini_25_flash")]
  Gemini25Flash,

  #[serde(rename = "nano_banana")]
  NanoBanana,

  #[serde(rename = "nano_banana_2")]
  NanoBanana2,

  #[serde(rename = "nano_banana_pro")]
  NanoBananaPro,

  #[serde(rename = "gpt_image_1")]
  GptImage1,

  #[serde(rename = "gpt_image_1p5")]
  GptImage1p5,

  #[serde(rename = "seedream_4")]
  Seedream4,

  #[serde(rename = "seedream_4p5")]
  Seedream4p5,

  #[serde(rename = "seedream_5_lite")]
  Seedream5Lite,

  #[serde(rename = "qwen_edit_2511_angles")]
  QwenEdit2511Angles,

  #[serde(rename = "flux_2_lora_angles")]
  Flux2LoraAngles,

//  #[serde(rename = "qwen")]
//  Qwen,
//
//  #[serde(rename = "seededit_3")]
//  SeedEdit3,
}

#[derive(Deserialize, Debug)]
pub struct EnqueueEditImageCommand {
  /// The provider to use (defaults to Artcraft/Storyteller).
  /// Not all (provider, model) combinations are valid.
  pub provider: Option<GenerationProvider>,

  /// The model to use.
  pub model: Option<ImageEditModel>,

  /// Images to use for the image edit.
  /// The first image is typically a 2D canvas or 3D stage, but doesn't have to be.
  /// There must be at least one image.
  pub image_media_tokens: Option<Vec<MediaFileToken>>,
  
  /// If set, this becomes the first image in the image media tokens (pushing back 
  /// each of the `image_media_tokens` by one).
  /// This is useful if we want to do prompt engineering.
  pub scene_image_media_token: Option<MediaFileToken>,

  /// The user's image generation prompt.
  pub prompt: String,

  /// Turn off the system prompt.
  pub disable_system_prompt: Option<bool>,

  /// Number of images to generate.
  pub image_count: Option<u32>,

  /// Aspect ratio.
  #[deprecated(note="use common_aspect_ratio")]
  pub aspect_ratio: Option<EditImageSize>,

  /// New field for aspect ratio.
  /// Not all models support each of these aspect ratios, but we can choose or interpolate sensibly.
  pub common_aspect_ratio: Option<CommonAspectRatio>,

  /// Image quality.
  pub image_quality: Option<EditImageQuality>,

  /// Image resolution
  pub image_resolution: Option<EditImageResolution>,

  /// OPTIONAL.
  /// Only for image angle edit models.
  pub horizontal_angle: Option<f64>,

  /// OPTIONAL.
  /// Only for image angle edit models.
  pub vertical_angle: Option<f64>,

  /// OPTIONAL.
  /// Only for image angle edit models.
  pub zoom: Option<f64>,

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
pub enum EditImageSize {
  Auto,
  Square,
  Wide,
  Tall,
}

#[derive(Deserialize, Debug, Copy, Clone)]
#[serde(rename_all = "snake_case")]
pub enum EditImageQuality {
  Auto,
  High,
  Medium,
  Low,
}

#[derive(Deserialize, Debug, Copy, Clone)]
#[serde(rename_all = "snake_case")]
pub enum EditImageResolution {
  /// 1K - nano banana pro
  OneK,
  /// 2K - nano banana pro
  TwoK,
  /// 4K - nano banana pro
  FourK,
}

#[derive(Serialize, Debug)]
#[serde(rename_all = "snake_case")]
pub enum EnqueueEditImageErrorType {
  /// Caller didn't specify a model
  ModelNotSpecified,

  /// No model available for image generation
  NoProviderAvailable,

  /// Generic bad request error
  BadRequest,

  /// Generic server error
  ServerError,

  /// The user is sending too many requests
  TooManyConcurrentTasks,
  /// User is not logged into Sora!
  SoraLoginRequired,
  /// The user needs to create a Sora account
  SoraUsernameNotYetCreated,
  /// The Sora service is having problems. Try again soon.
  SoraIsHavingProblems,
}

#[derive(Serialize)]
pub struct EnqueueEditImageSuccessResponse {
}

impl SerializeMarker for EnqueueEditImageSuccessResponse {}

#[tauri::command]
pub async fn enqueue_edit_image_command(
  app: AppHandle,
  request: EnqueueEditImageCommand,
  app_data_root: State<'_, AppDataRoot>,
  app_env_configs: State<'_, AppEnvConfigs>,
  artcraft_usage_tracker: State<'_, ArtcraftUsageTracker>,
  provider_priority_store: State<'_, ProviderPriorityStore>,
  task_database: State<'_, TaskDatabase>,
  storyteller_creds_manager: State<'_, StorytellerCredentialManager>,
  sora_creds_manager: State<'_, SoraCredentialManager>,
  sora_task_queue: State<'_, SoraTaskQueue>,
) -> ResponseOrErrorType<EnqueueEditImageSuccessResponse, EnqueueEditImageErrorType> {

  info!("enqueue_edit_image_command called; image media tokens : {:?}, full request: {:?}",
    &request.image_media_tokens, &request);

  let result = handle_request(
    &request,
    &app,
    &app_data_root,
    &app_env_configs,
    &artcraft_usage_tracker,
    &provider_priority_store,
    &task_database,
    &storyteller_creds_manager,
    &sora_creds_manager,
    &sora_task_queue,
  ).await;

  match result {
    Err(err) => {
      error!("Error enqueuing contextual edit image: {:?}", err);
      
      notify_frontend_of_errors(&app, &err).await;

      // TODO: Derive from err. Make service provider optional.
      let event = GenerationEnqueueFailureEvent {
        action: GenerationAction::GenerateImage,
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
        model: event.model,
      };

      if let Err(err) = event.send(&app) {
        error!("Failed to emit event: {:?}", err); // Fail open.
      }
      
      CreditsBalanceChangedEvent{}.send_infallible(&app);

      Ok(EnqueueEditImageSuccessResponse {}.into())
    }
  }
}

pub async fn handle_request(
  request: &EnqueueEditImageCommand,
  app: &AppHandle,
  app_data_root: &AppDataRoot,
  app_env_configs: &AppEnvConfigs,
  artcraft_usage_tracker: &ArtcraftUsageTracker,
  provider_priority_store: &ProviderPriorityStore,
  task_database: &TaskDatabase,
  storyteller_creds_manager: &StorytellerCredentialManager,
  sora_creds_manager: &SoraCredentialManager,
  sora_task_queue: &SoraTaskQueue,
) -> Result<TaskEnqueueSuccess, GenerateError> {

  let model = match request.model {
    Some(model) => model,
    None => {
      return Err(GenerateError::no_model_specified())
    }
  };

  let provider = request.provider
      .unwrap_or(GenerationProvider::Artcraft);
  
  info!("edit image with {:?} via provider {:?}", &model, &provider);

  let mut success_event = match provider {
    GenerationProvider::Artcraft => {
      handle_image_edit_artcraft(
        model,
        request,
        app,
        app_data_root,
        app_env_configs,
        storyteller_creds_manager,
      ).await?
    }
    GenerationProvider::Sora => {
      handle_image_edit_sora(
        model,
        request,
        app,
        app_data_root,
        app_env_configs,
        sora_creds_manager,
        sora_task_queue,
      ).await?
    }
    _ => {
      return Err(GenerateError::BadProviderForModel {
        provider,
        model: image_edit_model_to_model_type(model),
      })
    }
  };

  match request.frontend_caller {
    Some(TauriCommandCaller::ImageEditor) => {
      // NB: Certain image generations enqueued in the inpainting editor are classed
      // as "image_generation" and won't update the inpainting UI. This is a hack to
      // temporarily fix the UI event binding.
      // TODO: The frontend shouldn't require us to change the type to inpainting.
      success_event.task_type = TaskType::ImageInpaintEdit;
    }
    _ => {} // fall-through
  }

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

  // TODO: We don't know that this is strictly the edit page. It could be the stage. It might also be nice to distinguish inpainting.
  let num_images = request.image_count.map(|count| count as u16).unwrap_or(1);
  if let Err(err) = artcraft_usage_tracker.record_image_generation(num_images, ArtcraftUsageType::ImageToResult, ArtcraftUsagePage::EditPage) {
    // NB: Fail open.
    warn!("Failed to report usage: {:?}", err);
  }
  
  Ok(success_event)
}

fn error_to_tauri_response(error: GenerateError) -> CommandErrorResponseWrapper<EnqueueEditImageErrorType, ()> {
  let mut status = CommandErrorStatus::ServerError;
  let mut error_type = EnqueueEditImageErrorType::ServerError;
  let mut error_message = "A server error occurred. Please try again. If it continues, please tell our staff about the problem.".to_string();

  match error {
    GenerateError::BadInput(BadInputReason::NoModelSpecified) => {
      status = CommandErrorStatus::BadRequest;
      error_type = EnqueueEditImageErrorType::ModelNotSpecified;
      error_message = "No model specified for image generation".to_string();
    }
    GenerateError::NoProviderAvailable => {
      status = CommandErrorStatus::ServerError;
      error_type = EnqueueEditImageErrorType::NoProviderAvailable;
      error_message = "No configured provider available for image generation".to_string();
    }
    GenerateError::BadInput(BadInputReason::InvalidNumberOfRequestedImages { min, max, requested }) => {
      status = CommandErrorStatus::BadRequest;
      error_type = EnqueueEditImageErrorType::BadRequest;
      error_message = format!("Invalid number of images requested ({}). Must be between {} and {}", requested, min, max);

    }
    GenerateError::BadInput(BadInputReason::InvalidNumberOfInputImages{  min, max, provided }) => {
      status = CommandErrorStatus::BadRequest;
      error_type = EnqueueEditImageErrorType::BadRequest;
      error_message = format!("Invalid number of input images ({}). Must be between {} and {}", provided, min, max);
    }
    _ => {} // Fall-through for now
  }

  CommandErrorResponseWrapper {
    status,
    error_message: Some(error_message.to_string()),
    error_type: Some(error_type),
    error_details: None,
  }
}
