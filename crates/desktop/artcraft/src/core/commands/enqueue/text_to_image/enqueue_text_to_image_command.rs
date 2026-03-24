use crate::core::api_adapters::aspect_ratio::common_aspect_ratio::CommonAspectRatio;
use crate::core::api_adapters::resolution::common_resolution::CommonResolution;
use crate::core::commands::enqueue::common::notify_frontend_of_errors::notify_frontend_of_errors;
use crate::core::commands::enqueue::generate_error::{BadInputReason, GenerateError, MissingCredentialsReason};
use crate::core::commands::enqueue::image_edit::image_edit_models::image_edit_model_to_model_type;
use crate::core::commands::enqueue::task_enqueue_success::TaskEnqueueSuccess;
use crate::core::commands::enqueue::text_to_image::artcraft::handle_text_to_image_artcraft::handle_text_to_image_artcraft;
use crate::core::commands::enqueue::text_to_image::grok::handle_grok::handle_grok;
use crate::core::commands::enqueue::text_to_image::midjourney::handle_midjourney::handle_midjourney;
use crate::core::commands::enqueue::text_to_image::sora::handle_text_to_image_sora::handle_text_to_image_sora;
use crate::core::commands::enqueue::text_to_image::text_to_image_models::text_to_image_model_to_model_type;
use crate::core::commands::response::failure_response_wrapper::{CommandErrorResponseWrapper, CommandErrorStatus};
use crate::core::commands::response::shorthand::Response;
use crate::core::commands::response::success_response_wrapper::SerializeMarker;
use crate::core::events::basic_sendable_event_trait::BasicSendableEvent;
use crate::core::events::functional_events::credits_balance_changed_event::CreditsBalanceChangedEvent;
use crate::core::events::generation_events::common::{GenerationAction, GenerationServiceProvider};
use crate::core::events::generation_events::generation_enqueue_success_event::GenerationEnqueueSuccessEvent;
use crate::core::events::sendable_event_trait::SendableEvent;
use crate::core::state::app_env_configs::app_env_configs::AppEnvConfigs;
use crate::core::state::artcraft_usage_tracker::artcraft_usage_tracker::ArtcraftUsageTracker;
use crate::core::state::artcraft_usage_tracker::artcraft_usage_type::{ArtcraftUsagePage, ArtcraftUsageType};
use crate::core::state::data_dir::app_data_root::AppDataRoot;
use crate::core::state::provider_priority::{Provider, ProviderPriorityStore};
use crate::core::state::task_database::TaskDatabase;
use crate::services::grok::state::grok_credential_manager::GrokCredentialManager;
use crate::services::grok::state::grok_image_prompt_queue::GrokImagePromptQueue;
use crate::services::midjourney::state::midjourney_credential_manager::MidjourneyCredentialManager;
use crate::services::sora::state::sora_credential_manager::SoraCredentialManager;
use crate::services::sora::state::sora_task_queue::SoraTaskQueue;
use crate::services::storyteller::state::storyteller_credential_manager::StorytellerCredentialManager;
use enums::common::generation_provider::GenerationProvider;
use enums::tauri::ux::tauri_command_caller::TauriCommandCaller;
use log::{error, info, warn};
use serde::{Deserialize, Serialize};
use sqlite_tasks::queries::create_task::{create_task, CreateTaskArgs};
use tauri::{AppHandle, State};
use tokens::tokens::media_files::MediaFileToken;

/// This is used in the Tauri command bridge.
/// Don't change the serializations without coordinating with the frontend.
#[derive(Deserialize, Debug, Copy, Clone)]
#[serde(rename_all = "snake_case")]
pub enum TextToImageModel {
  #[serde(rename = "flux_1_dev")]
  Flux1Dev,
  #[serde(rename = "flux_1_schnell")]
  Flux1Schnell,
  #[serde(rename = "flux_pro_11")]
  FluxPro11,
  #[serde(rename = "flux_pro_11_ultra")]
  FluxPro11Ultra,
  #[serde(rename = "grok_image")]
  GrokImage,
  #[serde(rename = "recraft_3")]
  Recraft3,

  #[serde(rename = "gpt_image_1")]
  GptImage1,
  #[serde(rename = "gpt_image_1p5")]
  GptImage1p5,
  #[serde(rename = "gemini_25_flash")]
  Gemini25Flash,
  #[serde(rename = "nano_banana")]
  NanoBanana,
  #[serde(rename = "nano_banana_2")]
  NanoBanana2,
  #[serde(rename = "nano_banana_pro")]
  NanoBananaPro,
  #[serde(rename = "seedream_4")]
  Seedream4,
  #[serde(rename = "seedream_4p5")]
  Seedream4p5,
  #[serde(rename = "seedream_5_lite")]
  Seedream5Lite,

  // Generic Midjourney model, version unknown.
  #[serde(rename = "midjourney")]
  Midjourney,
}

#[derive(Deserialize, Debug)]
pub struct EnqueueTextToImageRequest {
  /// The provider to use (defaults to Artcraft/Storyteller).
  /// Not all (provider, model) combinations are valid.
  pub provider: Option<GenerationProvider>,

  /// The model to use.
  pub model: Option<TextToImageModel>,

  /// Text prompt for the image generation. Required.
  pub prompt: Option<String>,

  /// New field for aspect ratio.
  /// Not all models support each of these aspect ratios, but we can choose or interpolate sensibly.
  pub common_aspect_ratio: Option<CommonAspectRatio>,

  /// New field for resolution.
  /// Not all models support each of these resolutions, but we can choose or interpolate sensibly.
  pub common_resolution: Option<CommonResolution>,

  /// Aspect ratio.
  #[deprecated(note="use common_aspect_ratio")]
  pub aspect_ratio: Option<TextToImageSize>,

  /// Aspect ratio.
  #[deprecated(note="use common_resolution")]
  pub image_resolution: Option<TextToImageResolution>,

  /// The number of images to generate.
  pub number_images: Option<u32>,

  /// OPTIONAL.
  /// Reference images (without semantics)
  /// The purpose varies on a model-by-model basis, but they
  /// are not semantically treated as "style reference",
  /// "character/object reference", etc.
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

// TODO(bt,2025-07-14): Support other aspect ratios / resolutions -
//  Flux Dev has: 4:3, 16:9, 3:4, 9:16, and custom.
//  Flux Schnell has: 4:3, 16:9, 3:4, 9:16, and custom.
//  Flux Pro has: 4:3, 16:9, 3:4, 9:16, and custom.
//  Flux Pro Ulra has: 4:3, 16:9, 3:4, 9:16, and custom.

#[derive(Deserialize, Debug, Copy, Clone)]
#[serde(rename_all = "snake_case")]
pub enum TextToImageSize {
  Auto,
  Square,
  Wide,
  Tall,
}

#[derive(Deserialize, Debug, Copy, Clone)]
#[serde(rename_all = "snake_case")]
pub enum TextToImageResolution {
  /// 1K - nano banana pro
  OneK,
  /// 2K - nano banana pro
  TwoK,
  /// 4K - nano banana pro
  FourK,
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
  request: EnqueueTextToImageRequest,
  app: AppHandle,
  app_data_root: State<'_, AppDataRoot>,
  app_env_configs: State<'_, AppEnvConfigs>,
  artcraft_usage_tracker: State<'_, ArtcraftUsageTracker>,
  provider_priority_store: State<'_, ProviderPriorityStore>,
  task_database: State<'_, TaskDatabase>,
  mj_creds_manager: State<'_, MidjourneyCredentialManager>,
  grok_creds_manager: State<'_, GrokCredentialManager>,
  grok_image_prompt_queue: State<'_, GrokImagePromptQueue>,
  storyteller_creds_manager: State<'_, StorytellerCredentialManager>,
  sora_creds_manager: State<'_, SoraCredentialManager>,
  sora_task_queue: State<'_, SoraTaskQueue>,
) -> Response<EnqueueTextToImageSuccessResponse, EnqueueTextToImageErrorType, ()> {

  info!("enqueue_text_to_image called");

  info!("request: {:?}", request);

  let result = handle_request(
    request,
    &app,
    &app_data_root,
    &artcraft_usage_tracker,
    &provider_priority_store,
    &task_database,
    &mj_creds_manager,
    &grok_creds_manager,
    &grok_image_prompt_queue,
    &storyteller_creds_manager,
    &app_env_configs,
    &sora_creds_manager,
    &sora_task_queue,
  ).await;

  match result {
    Err(err) => {
      error!("error: {:?}", err);

      notify_frontend_of_errors(&app, &err).await;

      let mut status = CommandErrorStatus::ServerError;
      let mut error_type = EnqueueTextToImageErrorType::ServerError;
      let mut error_message = "A server error occurred. Please try again. If it continues, please tell our staff about the problem.";

      match err {
        GenerateError::BadInput(BadInputReason::NoModelSpecified) => {
          status = CommandErrorStatus::BadRequest;
          error_type = EnqueueTextToImageErrorType::ModelNotSpecified;
          error_message = "No model specified for image generation";
        }
        GenerateError::NoProviderAvailable => {
          status = CommandErrorStatus::ServerError;
          error_type = EnqueueTextToImageErrorType::NoProviderAvailable;
          error_message = "No configured provider available for image generation";
        }
        GenerateError::MissingCredentials(MissingCredentialsReason::NeedsFalApiKey) => {
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
      
      CreditsBalanceChangedEvent{}.send_infallible(&app);

      Ok(EnqueueTextToImageSuccessResponse {}.into())
    }
  }
}

pub async fn handle_request(
  request: EnqueueTextToImageRequest,
  app: &AppHandle,
  app_data_root: &AppDataRoot,
  artcraft_usage_tracker: &ArtcraftUsageTracker,
  provider_priority_store: &ProviderPriorityStore,
  task_database: &TaskDatabase,
  mj_creds_manager: &MidjourneyCredentialManager,
  grok_creds_manager: &GrokCredentialManager,
  grok_image_prompt_queue: &GrokImagePromptQueue,
  storyteller_creds_manager: &StorytellerCredentialManager,
  app_env_configs: &AppEnvConfigs,
  sora_creds_manager: &SoraCredentialManager,
  sora_task_queue: &SoraTaskQueue,
) -> Result<TaskEnqueueSuccess, GenerateError> {
  
  let result = dispatch_request(
    &request,
    &app,
    &app_data_root,
    &provider_priority_store,
    &storyteller_creds_manager,
    &app_env_configs,
    &mj_creds_manager,
    &grok_creds_manager,
    &grok_image_prompt_queue,
    &sora_creds_manager,
    &sora_task_queue,
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

  let num_images = request.number_images.map(|n| n as u16).unwrap_or(1);
  
  let is_image_to_image = request.image_media_tokens
      .as_ref()
      .map(|tokens| !tokens.is_empty())
      .unwrap_or(false);
  
  let usage_type = if is_image_to_image {
    ArtcraftUsageType::ImageToResult
  } else {
    ArtcraftUsageType::TextToResult
  };
  
  if let Err(err) = artcraft_usage_tracker.record_image_generation(num_images, usage_type, ArtcraftUsagePage::ImagePage) {
    // NB: Fail open.
    warn!("Failed to report usage: {:?}", err);
  }
  
  Ok(success_event)
}

pub async fn dispatch_request(
  request: &EnqueueTextToImageRequest,
  app: &AppHandle,
  app_data_root: &AppDataRoot,
  provider_priority_store: &ProviderPriorityStore,
  storyteller_creds_manager: &StorytellerCredentialManager,
  app_env_configs: &AppEnvConfigs,
  mj_creds_manager: &MidjourneyCredentialManager,
  grok_creds_manager: &GrokCredentialManager,
  grok_image_prompt_queue: &GrokImagePromptQueue,
  sora_creds_manager: &SoraCredentialManager,
  sora_task_queue: &SoraTaskQueue,
) -> Result<TaskEnqueueSuccess, GenerateError> {

  let model = match request.model {
    Some(model) => model,
    None => {
      return Err(GenerateError::no_model_specified())
    }
  };

  let provider = match (model, request.provider) {
    (TextToImageModel::GrokImage, _) => GenerationProvider::Grok,
    (TextToImageModel::Midjourney, _) => GenerationProvider::Midjourney,
    _ => request.provider.unwrap_or(GenerationProvider::Artcraft),
  };

  info!("generate image with {:?} via provider {:?}", &model, &provider);

  match provider {
    GenerationProvider::Artcraft => {
      handle_text_to_image_artcraft(
        model,
        request,
        app,
        app_data_root,
        app_env_configs,
        storyteller_creds_manager,
      ).await
    }
    GenerationProvider::Grok => {
      handle_grok(
        app,
        request,
        app_env_configs,
        grok_creds_manager,
        grok_image_prompt_queue,
      ).await
    }
    GenerationProvider::Midjourney => {
      handle_midjourney(
        app,
        request,
        app_env_configs,
        mj_creds_manager,
      ).await
    }
    GenerationProvider::Sora => {
      handle_text_to_image_sora(
        request,
        app,
        sora_creds_manager,
        sora_task_queue,
      ).await
    }
    _ => {
      Err(GenerateError::BadProviderForModel {
        provider,
        model: text_to_image_model_to_model_type(model),
      })
    }
  }
}
