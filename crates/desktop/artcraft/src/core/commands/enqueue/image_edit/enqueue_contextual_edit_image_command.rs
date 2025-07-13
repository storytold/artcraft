use crate::core::commands::enqueue::image::enqueue_text_to_image_command::{EnqueueTextToImageRequest, EnqueueTextToImageSuccessResponse};
use crate::core::commands::enqueue::image::internal_image_error::InternalImageError;
use crate::core::commands::enqueue::image_edit::errors::InternalContextualEditImageError;
use crate::core::commands::enqueue::image_edit::gpt_image_1::handle_gpt_image_1::handle_gpt_image_1;
use crate::core::commands::enqueue::task_enqueue_success::TaskEnqueueSuccess;
use crate::core::commands::response::failure_response_wrapper::{CommandErrorResponseWrapper, CommandErrorStatus};
use crate::core::commands::response::shorthand::{Response, ResponseOrErrorType};
use crate::core::commands::response::success_response_wrapper::SerializeMarker;
use crate::core::events::basic_sendable_event_trait::BasicSendableEvent;
use crate::core::events::generation_events::common::{GenerationAction, GenerationServiceProvider};
use crate::core::events::generation_events::generation_enqueue_failure_event::GenerationEnqueueFailureEvent;
use crate::core::events::generation_events::generation_enqueue_success_event::GenerationEnqueueSuccessEvent;
use crate::core::events::sendable_event_trait::SendableEvent;
use crate::core::model::contextual_image_edit_models::ContextualImageEditModel;
use crate::core::model::image_models::ImageModel;
use crate::core::state::app_env_configs::app_env_configs::AppEnvConfigs;
use crate::core::state::data_dir::app_data_root::AppDataRoot;
use crate::core::state::data_dir::trait_data_subdir::DataSubdir;
use crate::core::state::provider_priority::ProviderPriorityStore;
use crate::core::state::task_database::TaskDatabase;
use crate::core::utils::get_url_file_extension::get_url_file_extension;
use crate::core::utils::simple_http_download::simple_http_download;
use crate::services::fal::state::fal_credential_manager::FalCredentialManager;
use crate::services::fal::state::fal_task_queue::FalTaskQueue;
use crate::services::sora::state::sora_credential_manager::SoraCredentialManager;
use crate::services::sora::state::sora_task_queue::SoraTaskQueue;
use crate::services::storyteller::state::storyteller_credential_manager::StorytellerCredentialManager;
use enums::common::generation_provider::GenerationProvider;
use enums::tauri::tasks::task_status::TaskStatus;
use enums::tauri::tasks::task_type::TaskType;
use errors::AnyhowError;
use log::{error, info, warn};
use openai_sora_client::recipes::image_remix_with_session_auto_renew::{image_remix_with_session_auto_renew, ImageRemixAutoRenewRequest};
use openai_sora_client::recipes::image_upload_from_file_with_session_auto_renew::{image_upload_from_file_with_session_auto_renew, ImageUploadFromFileAutoRenewRequest};
use openai_sora_client::recipes::maybe_upgrade_or_renew_session::maybe_upgrade_or_renew_session;
use openai_sora_client::requests::image_gen::common::{ImageSize, NumImages};
use openai_sora_client::sora_error::SoraError;
use serde_derive::{Deserialize, Serialize};
use sqlite_tasks::queries::create_task::{create_task, CreateTaskArgs};
use std::time::Duration;
use storyteller_client::error::storyteller_error::StorytellerError;
use storyteller_client::media_files::get_media_file::get_media_file;
use storyteller_client::utils::api_host::ApiHost;
use tauri::{AppHandle, Manager, State};
use tokens::tokens::media_files::MediaFileToken;

#[derive(Deserialize, Debug)]
pub struct EnqueueContextualEditImageCommand {
  /// The model to use.
  pub model: Option<ContextualImageEditModel>,

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
  pub aspect_ratio: Option<EditImageSize>,

  /// Image quality.
  pub image_quality: Option<EditImageQuality>,
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

#[derive(Serialize, Debug)]
#[serde(rename_all = "snake_case")]
pub enum EnqueueContextualEditImageErrorType {
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
pub struct EnqueueContextualEditImageSuccessResponse {
}

impl SerializeMarker for EnqueueContextualEditImageSuccessResponse {}

#[tauri::command]
pub async fn enqueue_contextual_edit_image_command(
  app: AppHandle,
  request: EnqueueContextualEditImageCommand,
  app_data_root: State<'_, AppDataRoot>,
  app_env_configs: State<'_, AppEnvConfigs>,
  provider_priority_store: State<'_, ProviderPriorityStore>,
  task_database: State<'_, TaskDatabase>,
  storyteller_creds_manager: State<'_, StorytellerCredentialManager>,
  fal_creds_manager: State<'_, FalCredentialManager>,
  fal_task_queue: State<'_, FalTaskQueue>,
  sora_creds_manager: State<'_, SoraCredentialManager>,
  sora_task_queue: State<'_, SoraTaskQueue>,
) -> ResponseOrErrorType<EnqueueContextualEditImageSuccessResponse, EnqueueContextualEditImageErrorType> {

  info!("enqueue_contextual_edit_image_command called; image media tokens : {:?}, full request: {:?}",
    &request.image_media_tokens, &request);

  let result = handle_request(
    &request,
    &app,
    &app_data_root,
    &app_env_configs,
    &provider_priority_store,
    &task_database,
    &storyteller_creds_manager,
    &fal_creds_manager,
    &fal_task_queue,
    &sora_creds_manager,
    &sora_task_queue,
  ).await;

  match result {
    Err(err) => {
      error!("Error enqueuing contextual edit image: {:?}", err);

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

      Err(err.to_tauri_response())
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

      Ok(EnqueueContextualEditImageSuccessResponse {}.into())
    }
  }
}

pub async fn handle_request(
  request: &EnqueueContextualEditImageCommand,
  app: &AppHandle,
  app_data_root: &AppDataRoot,
  app_env_configs: &AppEnvConfigs,
  provider_priority_store: &ProviderPriorityStore,
  task_database: &TaskDatabase,
  storyteller_creds_manager: &StorytellerCredentialManager,
  fal_creds_manager: &FalCredentialManager,
  fal_task_queue: &FalTaskQueue,
  sora_creds_manager: &SoraCredentialManager,
  sora_task_queue: &SoraTaskQueue,
) -> Result<TaskEnqueueSuccess, InternalContextualEditImageError> {
  let success_event= match request.model {
    None => {
      return Err(InternalContextualEditImageError::NoModelSpecified)
    }
    Some(ContextualImageEditModel::GptImage1) => {
      handle_gpt_image_1(
        request,
        app,
        app_data_root,
        app_env_configs,
        provider_priority_store,
        storyteller_creds_manager,
        fal_creds_manager,
        fal_task_queue,
        sora_creds_manager,
        sora_task_queue,
      ).await?
    }
    // TODO(bt,2025-07-05): Flux Kontext, etc.
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
