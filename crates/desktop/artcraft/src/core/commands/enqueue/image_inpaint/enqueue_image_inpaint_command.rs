use crate::core::commands::enqueue::common::notify_frontend_of_errors::notify_frontend_of_errors;
use crate::core::commands::enqueue::generate_error::{BadInputReason, GenerateError};
use crate::core::commands::enqueue::image_edit::image_edit_models::image_edit_model_to_model_type;
use crate::core::commands::enqueue::image_inpaint::artcraft::handle_inpaint_artcraft::handle_inpaint_artcraft;
use crate::core::commands::enqueue::image_inpaint::inpaint_models::image_inpaint_model_to_model_type;
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

#[derive(Deserialize, Debug, Copy, Clone)]
#[serde(rename_all = "snake_case")]
pub enum ImageInpaintModel {
  /*
   * Mask-based inpainting models
   */
  
  #[serde(rename = "flux_dev_juggernaut")]
  FluxDevJuggernaut,
  
  #[serde(rename = "flux_pro_1")]
  FluxPro1,

  /* 
   * Non-inpainting, instructive editing models
   * NB: We're supporting these to keep the app simple and not over-complicate the javascript
   */
  
  #[serde(rename = "flux_pro_kontext_max")]
  FluxProKontextMax,

  #[serde(rename = "gemini_25_flash")]
  Gemini25Flash,
}

#[derive(Deserialize, Debug)]
pub struct EnqueueInpaintImageCommand {
  /// The provider to use (defaults to Artcraft/Storyteller).
  /// Not all (provider, model) combinations are valid.
  pub provider: Option<GenerationProvider>,

  /// REQUIRED (Option<T> is just for error messages).
  /// The model to use.
  pub model: Option<ImageInpaintModel>,

  /// REQUIRED (Option<T> is just for error messages).
  /// The source image to edit.
  pub image_media_token: Option<MediaFileToken>,

  /// REQUIRED: Supply this *XOR* `mask_image_raw_bytes`.
  /// The mask to focus the edit (already uploaded).
  pub mask_image_media_token: Option<MediaFileToken>,

  /// REQUIRED: Supply this *XOR* `mask_image_media_token`.
  /// The mask to focus the edit (raw bytes).
  pub mask_image_raw_bytes: Option<Vec<u8>>,

  /// REQUIRED.
  /// The user's image generation prompt.
  pub prompt: String,

  /// Number of images to generate.
  pub image_count: Option<u32>,
  
  /// If true, force the dimensions of the source image and mask image to match.
  pub require_matching_dimensions: Option<bool>,

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
pub enum EnqueueInpaintImageErrorType {
  /// Caller didn't specify a model
  ModelNotSpecified,

  /// No model available for image generation
  NoProviderAvailable,

  /// No source image was supplied.
  NoSourceImageSpecified,

  /// No mask image was supplied.
  NoMaskImageSpecified,

  /// Too many mask images were supplied.
  MultipleMaskImagesSpecified,

  /// Bad mask image was supplied.
  BadMaskImage,
  
  /// Generic bad request error
  BadRequest,

  /// Generic server error
  ServerError,
}

#[derive(Serialize)]
pub struct EnqueueImageInpaintSuccessResponse {
}

impl SerializeMarker for EnqueueImageInpaintSuccessResponse {}

#[tauri::command]
pub async fn enqueue_image_inpaint_command(
  app: AppHandle,
  request: EnqueueInpaintImageCommand,
  app_data_root: State<'_, AppDataRoot>,
  app_env_configs: State<'_, AppEnvConfigs>,
  artcraft_usage_tracker: State<'_, ArtcraftUsageTracker>,
  provider_priority_store: State<'_, ProviderPriorityStore>,
  task_database: State<'_, TaskDatabase>,
  storyteller_creds_manager: State<'_, StorytellerCredentialManager>,
  sora_creds_manager: State<'_, SoraCredentialManager>,
  sora_task_queue: State<'_, SoraTaskQueue>,
) -> ResponseOrErrorType<EnqueueImageInpaintSuccessResponse, EnqueueInpaintImageErrorType> {

  info!("enqueue_image_inpaint_command called; model: {:?}, image_media_token: {:?}, prompt: {:?}, image_count: {:?}",
    &request.model, &request.image_media_token, &request.prompt, &request.image_count);

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
      error!("Error enqueuing inpaint image: {:?}", err);
      
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

      Ok(EnqueueImageInpaintSuccessResponse {}.into())
    }
  }
}

pub async fn handle_request(
  request: &EnqueueInpaintImageCommand,
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

  info!("image inpaint with {:?} via provider {:?}", &model, &provider);

  let success_event = match provider {
    GenerationProvider::Artcraft => {
      handle_inpaint_artcraft(
        model,
        request,
        app,
        app_data_root,
        app_env_configs,
        storyteller_creds_manager,
      ).await?
    }
    _ => {
      return Err(GenerateError::BadProviderForModel {
        provider,
        model: image_inpaint_model_to_model_type(model),
      })
    }
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

  // TODO: We don't know that this is strictly the edit page. It could be the stage. It might also be nice to distinguish inpainting.
  let num_images = request.image_count.map(|count| count as u16).unwrap_or(1);
  if let Err(err) = artcraft_usage_tracker.record_image_generation(num_images, ArtcraftUsageType::ImageToResult, ArtcraftUsagePage::EditPage) {
    // NB: Fail open.
    warn!("Failed to report usage: {:?}", err);
  }

  Ok(success_event)
}

pub fn error_to_tauri_response(error: GenerateError) -> CommandErrorResponseWrapper<EnqueueInpaintImageErrorType, ()> {
  let mut status = CommandErrorStatus::ServerError;
  let mut error_type = EnqueueInpaintImageErrorType::ServerError;
  let mut error_message = "A server error occurred. Please try again. If it continues, please tell our staff about the problem.".to_string();

  match error {
    GenerateError::BadInput(BadInputReason::NoModelSpecified) => {
      status = CommandErrorStatus::BadRequest;
      error_type = EnqueueInpaintImageErrorType::ModelNotSpecified;
      error_message = "No model specified for image generation".to_string();
    }
    GenerateError::NoProviderAvailable => {
      status = CommandErrorStatus::ServerError;
      error_type = EnqueueInpaintImageErrorType::NoProviderAvailable;
      error_message = "No configured provider available for image generation".to_string();
    }
    GenerateError::BadInput(BadInputReason::RequiredSourceImageNotProvided) => {
      status = CommandErrorStatus::BadRequest;
      error_type = EnqueueInpaintImageErrorType::NoSourceImageSpecified;
      error_message = "No source image was provided".to_string();
    }
    GenerateError::BadInput(BadInputReason::RequiredSourceImageMaskNotProvided) => {
      status = CommandErrorStatus::BadRequest;
      error_type = EnqueueInpaintImageErrorType::NoMaskImageSpecified;
      error_message = "No mask image was provided".to_string();
    }
    GenerateError::BadInput(BadInputReason::BothImageMaskMediaTokenAndBytesSupplied) => {
      status = CommandErrorStatus::BadRequest;
      error_type = EnqueueInpaintImageErrorType::MultipleMaskImagesSpecified;
      error_message = "multiple mask images provided".to_string();
    }
    GenerateError::BadInput(BadInputReason::CannotDetermineImageMimeType) => {
      status = CommandErrorStatus::BadRequest;
      error_type = EnqueueInpaintImageErrorType::BadMaskImage;
      error_message = "bad mask image (mime)".to_string();
    }
    GenerateError::BadInput(BadInputReason::InvalidNumberOfRequestedImages { min, max, requested }) => {
      status = CommandErrorStatus::BadRequest;
      error_type = EnqueueInpaintImageErrorType::BadRequest;
      error_message = format!("Invalid number of images requested ({}). Must be between {} and {}", requested, min, max);
    }
    GenerateError::BadInput(BadInputReason::InvalidNumberOfInputImages{  min, max, provided }) => {
      status = CommandErrorStatus::BadRequest;
      error_type = EnqueueInpaintImageErrorType::BadRequest;
      error_message = format!("Invalid number of input images ({}). Must be between {} and {}", provided, min, max);
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
