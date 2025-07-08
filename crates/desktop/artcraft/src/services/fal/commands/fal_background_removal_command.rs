use crate::core::artcraft_error::ArtcraftError;
use crate::core::commands::response::failure_response_wrapper::{CommandErrorResponseWrapper, CommandErrorStatus};
use crate::core::commands::response::shorthand::Response;
use crate::core::commands::response::success_response_wrapper::SerializeMarker;
use crate::core::events::basic_sendable_event_trait::BasicSendableEvent;
use crate::core::events::generation_events::common::{GenerationAction, GenerationServiceProvider};
use crate::core::events::generation_events::generation_enqueue_failure_event::GenerationEnqueueFailureEvent;
use crate::core::events::generation_events::generation_enqueue_success_event::GenerationEnqueueSuccessEvent;
use crate::core::events::sendable_event_trait::SendableEvent;
use crate::core::state::app_env_configs::app_env_configs::AppEnvConfigs;
use crate::core::state::data_dir::app_data_root::AppDataRoot;
use crate::core::state::data_dir::trait_data_subdir::DataSubdir;
use crate::core::utils::download_media_file_to_temp_dir::download_media_file_to_temp_dir;
use crate::core::utils::get_url_file_extension::get_url_file_extension;
use crate::core::utils::save_base64_image_to_temp_dir::save_base64_image_to_temp_dir;
use crate::core::utils::simple_http_download_to_tempfile::simple_http_download_to_tempfile;
use crate::services::fal::state::fal_credential_manager::FalCredentialManager;
use crate::services::storyteller::state::storyteller_credential_manager::StorytellerCredentialManager;
use anyhow::anyhow;
use base64::prelude::BASE64_STANDARD;
use base64::{DecodeError, Engine};
use errors::AnyhowError;
use fal_client::error::fal_error_plus::FalErrorPlus;
use fal_client::requests::queue::remove_background_rembg::remove_background_rembg;
use filesys::file_read_bytes::file_read_bytes;
use image::{EncodableLayout, ImageReader};
use log::{error, info, warn};
use reqwest::Url;
use serde_derive::{Deserialize, Serialize};
use storyteller_client::error::storyteller_error::StorytellerError;
use storyteller_client::media_files::get_media_file::{get_media_file, GetMediaFileSuccessResponse};
use storyteller_client::media_files::upload_image_media_file_from_file::upload_image_media_file_from_file;
use storyteller_client::utils::api_host::ApiHost;
use tauri::{AppHandle, Manager, State};
use tokens::tokens::media_files::MediaFileToken;

#[derive(Deserialize)]
pub struct FalBackgroundRemovalRequest {
  /// Image media file; the image to remove the background from.
  pub image_media_token: Option<MediaFileToken>,
  
  /// Base64-encoded image
  pub base64_image: Option<String>,
}

#[derive(Serialize)]
pub struct FalBackgroundRemovalSuccessResponse {
  /// Result media token
  pub media_token: MediaFileToken,
  /// Result URL
  pub cdn_url: Url,
  /// Base64 bytes
  pub base64_bytes: String,
}

impl SerializeMarker for FalBackgroundRemovalSuccessResponse {}

#[derive(Serialize, Debug)]
#[serde(rename_all = "snake_case")]
pub enum BackgroundRemovalErrorType {
  /// Generic server error
  ServerError,
  /// No Fal API key available
  NeedsFalApiKey,
}


#[tauri::command]
pub async fn fal_background_removal_command(
  app: AppHandle,
  request: FalBackgroundRemovalRequest,
  app_env_configs: State<'_, AppEnvConfigs>,
  app_data_root: State<'_, AppDataRoot>,
  fal_creds_manager: State<'_, FalCredentialManager>,
  storyteller_creds_manager: State<'_, StorytellerCredentialManager>,
) -> Response<FalBackgroundRemovalSuccessResponse, BackgroundRemovalErrorType, ()> {
  
  info!("fal_background_removal_command called; image media token: {:?}", request.image_media_token);

  let has_credentials = fal_creds_manager
      .has_apparent_api_token()
      .unwrap_or(true); // NB: Failures would be lock issues
  
  if !has_credentials {
    warn!("No API key found");
    let event = 
        GenerationEnqueueFailureEvent::no_fal_api_key(GenerationAction::RemoveBackground);

    if let Err(err) = event.send(&app) {
      error!("Failed to emit event: {:?}", err); // Fail open.
    }
    
    return Err(CommandErrorResponseWrapper {
      status: CommandErrorStatus::Unauthorized,
      error_message: Some("You need to set a FAL api key".to_string()),
      error_type: Some(BackgroundRemovalErrorType::NeedsFalApiKey),
      error_details: None,
    });
  }

  let event = GenerationEnqueueSuccessEvent {
    action: GenerationAction::RemoveBackground,
    service: GenerationServiceProvider::Fal,
    model: None,
  };

  if let Err(err) = event.send(&app) {
    error!("Failed to emit event: {:?}", err); // Fail open.
  }

  let result = remove_background(
    request,
    &app_env_configs,
    &app_data_root, 
    &fal_creds_manager, 
    &storyteller_creds_manager
  ).await;
  
  match result {
    Err(err) => {
      error!("error: {:?}", err);

      let event = GenerationEnqueueFailureEvent {
        action: GenerationAction::RemoveBackground,
        service: GenerationServiceProvider::Fal,
        model: None,
        reason: None,
      };

      if let Err(err) = event.send(&app) {
        error!("Failed to emit event: {:?}", err); // Fail open.
      }

      let mut status = CommandErrorStatus::ServerError;
      let mut error_type = BackgroundRemovalErrorType::ServerError;
      let mut error_message = "A server error occurred. Please try again. If it continues, please tell our staff about the problem.";
      
      Err(CommandErrorResponseWrapper {
        status,
        error_message: Some(error_message.to_string()),
        error_type: Some(error_type),
        error_details: None,
      })
    }
    Ok(result) => {
      Ok(FalBackgroundRemovalSuccessResponse {
        media_token: result.0.media_file.token,
        cdn_url: result.0.media_file.media_links.cdn_url,
        base64_bytes: result.1,
      }.into())
    }
  }
}

#[derive(Debug)]
enum InnerError {
  FalError(FalErrorPlus),
  AnyhowError(AnyhowError),
  StorytellerError(StorytellerError),
  DecodeError(DecodeError),
  IoError(std::io::Error),
  ArtcraftError(ArtcraftError),
}

impl From<AnyhowError> for InnerError {
  fn from(value: AnyhowError) -> Self {
    Self::AnyhowError(value)
  }
}

impl From<FalErrorPlus> for InnerError {
  fn from(value: FalErrorPlus) -> Self {
    Self::FalError(value)
  }
}

impl From<StorytellerError> for InnerError {
  fn from(value: StorytellerError) -> Self {
    Self::StorytellerError(value)
  }
}

impl From<DecodeError> for InnerError {
  fn from(value: DecodeError) -> Self {
    Self::DecodeError(value)
  }
}

impl From<std::io::Error> for InnerError {
  fn from(value: std::io::Error) -> Self {
    Self::IoError(value)
  }
}

impl From<ArtcraftError> for InnerError {
  fn from(value: ArtcraftError) -> Self {
    match value {
      ArtcraftError::AnyhowError(e) => Self::AnyhowError(e),
      ArtcraftError::DecodeError(e) => Self::DecodeError(e),
      ArtcraftError::IoError(e) => Self::IoError(e),
      _ => Self::ArtcraftError(value),
    }
  }
}

pub async fn remove_background(
  request: FalBackgroundRemovalRequest,
  app_env_configs: &AppEnvConfigs,
  app_data_root: &AppDataRoot,
  fal_creds_manager: &FalCredentialManager,
  storyteller_creds_manager: &StorytellerCredentialManager,
) -> Result<(GetMediaFileSuccessResponse, String), InnerError> {
  
  let api_key = fal_creds_manager.get_key_required()?;
  let creds = storyteller_creds_manager.get_credentials_required()?;
  
  let mut temp_download;
  
  if let Some(media_token) = request.image_media_token {
    info!("From media token: {:?}", &media_token);
    temp_download = download_media_file_to_temp_dir(
      app_env_configs,
      app_data_root, 
      &media_token
    ).await?;
  } else if let Some(base64_bytes) = request.base64_image {
    info!("From base64 bytes...");
    temp_download = save_base64_image_to_temp_dir(&app_data_root, &base64_bytes).await?;
  } else {
    return Err(InnerError::AnyhowError(anyhow!("No image media token or base64 image provided")));
  }

  info!("Calling FAL image background removal...");

  let filename = temp_download.path().to_path_buf();
  
  let result = remove_background_rembg(filename, &api_key).await?;
  
  info!("Unpacking FAL result...");

  let extension_with_dot = get_url_file_extension(&result.image_url)
      .map(|ext| format!(".{}", ext))
      .unwrap_or_else(|| ".png".to_string());

  let mut result_file = app_data_root.temp_dir().new_named_temp_file_with_extension(&extension_with_dot)?;

  info!("Downloading file result file...");
  
  simple_http_download_to_tempfile(&result.image_url, &mut result_file).await?;

  let result_filename = result_file.path().to_path_buf();

  // NB: We couldn't pass the existing file handle as I think the file handle pointer is already at the EOF
  let bytes = file_read_bytes(&result_filename)?;
  let base64_bytes = BASE64_STANDARD.encode(bytes.as_bytes());

  info!("Uploading image media file...");

  let upload_result = upload_image_media_file_from_file(
    &app_env_configs.storyteller_host, 
    Some(&creds), 
    result_filename,
  ).await?;

  // TODO: Don't re-request to simply build MediaLinks (or CDN URL). Get those from the upload API in one turn.
  info!("Re-requesting media file...");
  
  let response = get_media_file(
    &app_env_configs.storyteller_host,
    &upload_result.media_file_token,
  ).await?;
  
  info!("Uploaded media file: {:?}", response.media_file.token);

  Ok((response, base64_bytes))
}
