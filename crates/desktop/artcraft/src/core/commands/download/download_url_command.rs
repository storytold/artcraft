use crate::core::api_adapters::aspect_ratio::common_aspect_ratio::CommonAspectRatio;
use crate::core::artcraft_error::ArtcraftError;
use crate::core::commands::response::failure_response_wrapper::{CommandErrorResponseWrapper, CommandErrorStatus};
use crate::core::commands::response::shorthand::{Response, ResponseOrErrorType};
use crate::core::commands::response::success_response_wrapper::SerializeMarker;
use crate::core::events::basic_sendable_event_trait::BasicSendableEvent;
use crate::core::events::warning_events::flash_file_download_error_event::{FlashFileDownloadErrorType, FlashFileDownloadErrorEvent};
use crate::core::state::app_env_configs::app_env_configs::AppEnvConfigs;
use crate::core::state::app_preferences::app_preferences::AppPreferences;
use crate::core::state::app_preferences::app_preferences_manager::AppPreferencesManager;
use crate::core::state::data_dir::app_data_root::AppDataRoot;
use crate::core::utils::download_url_to_temp_dir::download_url_to_temp_dir;
use crate::core::utils::download_url_to_user_download_dir::download_url_to_user_download_dir;
use anyhow::anyhow;
use log::{error, info};
use serde_derive::{Deserialize, Serialize};
use std::path::PathBuf;
use std::str::FromStr;
use artcraft_client::endpoints::media_files::get_media_file::get_media_file;
use tauri::{AppHandle, State};
use url::Url;

#[derive(Deserialize, Debug)]
pub struct DownloadUrlRequest {
  pub url: Url,
}

#[derive(Serialize)]
pub struct DownloadUrlSuccessResponse {
}

impl SerializeMarker for DownloadUrlSuccessResponse {}

#[derive(Serialize, Debug)]
#[serde(rename_all = "snake_case")]
pub enum DownloadUrlErrorType {
  FilesystemError,
  NetworkError,
  UnknownError,
}


#[tauri::command]
pub async fn download_url_command(
  request: DownloadUrlRequest,
  app: AppHandle,
  app_prefs: State<'_, AppPreferencesManager>,
  app_data_root: State<'_, AppDataRoot>,
  app_env_configs: State<'_, AppEnvConfigs>,
) -> ResponseOrErrorType<DownloadUrlSuccessResponse, DownloadUrlErrorType> {

  info!("download_url_command called");

  info!("request: {:?}", request);

  let result = handle_request(
    request,
    &app,
    &app_prefs,
    &app_data_root,
    &app_env_configs,
  ).await;

  if let Err(err) = result {
    error!("Error downloading media: {:?}", err);

    let mut endpoint_message = "unknown error when downloading file";
    let mut error_type = DownloadUrlErrorType::UnknownError;

    let mut flash_error_type = FlashFileDownloadErrorType::UnknownError;
    let mut flash_filename = None;
    let mut flash_message = Some("Failed to download file".to_string());

    match err {
      ArtcraftError::CannotDownloadFilePathAlreadyExists { path } => {
        endpoint_message = "file already downloaded";
        error_type = DownloadUrlErrorType::FilesystemError;

        flash_error_type = FlashFileDownloadErrorType::FileAlreadyDownloaded;
        flash_message = Some(format!("File already downloaded: {:?}", path));
        flash_filename = Some(path);
      }
      _ => {}, // NB: Fall-through
    }

    let event = FlashFileDownloadErrorEvent {
      filename: flash_filename,
      message: flash_message,
      error_type: flash_error_type,
    };

    event.send_infallible(&app);

    return Err(CommandErrorResponseWrapper {
      status: CommandErrorStatus::ServerError,
      error_message: Some(endpoint_message.to_string()),
      error_type: Some(error_type),
      error_details: None,
    });
  }

  Ok(DownloadUrlSuccessResponse {}.into())
}


pub async fn handle_request(
  request: DownloadUrlRequest,
  app: &AppHandle,
  app_prefs: &AppPreferencesManager,
  app_data_root: &AppDataRoot,
  app_env_configs: &AppEnvConfigs
) -> Result<(), ArtcraftError> {

  let app_prefs = app_prefs.get_clone()?;

  let download_path = download_url_to_user_download_dir(
    &request.url,
    app_data_root,
    &app_prefs
  ).await?;

  info!("downloaded to: {:?}", download_path);

  Ok(())
}
