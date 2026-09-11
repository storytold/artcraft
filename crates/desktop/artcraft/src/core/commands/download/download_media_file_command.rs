use crate::core::api_adapters::aspect_ratio::common_aspect_ratio::CommonAspectRatio;
use crate::core::artcraft_error::ArtcraftError;
use crate::core::commands::response::failure_response_wrapper::{CommandErrorResponseWrapper, CommandErrorStatus};
use crate::core::commands::response::shorthand::{Response, ResponseOrErrorType};
use crate::core::commands::response::success_response_wrapper::SerializeMarker;
use crate::core::state::app_env_configs::app_env_configs::AppEnvConfigs;
use crate::core::state::app_preferences::app_preferences::AppPreferences;
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
use tokens::tokens::media_files::MediaFileToken;
use crate::core::state::app_preferences::app_preferences_manager::AppPreferencesManager;

#[derive(Deserialize, Debug)]
pub struct DownloadMediaFileRequest {
  pub media_token: MediaFileToken,
}

#[derive(Serialize)]
pub struct DownloadMediaFileSuccessResponse {
}

impl SerializeMarker for DownloadMediaFileSuccessResponse {}

#[derive(Serialize, Debug)]
#[serde(rename_all = "snake_case")]
pub enum DownloadMediaFileErrorType {
  FilesystemError,
  NetworkError,
  UnknownError,
}


#[tauri::command]
pub async fn download_media_file_command(
  request: DownloadMediaFileRequest,
  app: AppHandle,
  app_prefs: State<'_, AppPreferencesManager>,
  app_data_root: State<'_, AppDataRoot>,
  app_env_configs: State<'_, AppEnvConfigs>,
) -> ResponseOrErrorType<DownloadMediaFileSuccessResponse, DownloadMediaFileErrorType> {

  info!("download_media_file_command called");

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
    // TODO: This error is semantically incorrect - just trying to get the code done
    return Err(CommandErrorResponseWrapper {
      status: CommandErrorStatus::ServerError,
      error_message: Some("error downloading file".to_string()),
      error_type: Some(DownloadMediaFileErrorType::UnknownError),
      error_details: None,
    });
  }

  Ok(DownloadMediaFileSuccessResponse {}.into())
}


pub async fn handle_request(
  request: DownloadMediaFileRequest,
  app: &AppHandle,
  app_prefs: &AppPreferencesManager,
  app_data_root: &AppDataRoot,
  app_env_configs: &AppEnvConfigs
) -> Result<(), ArtcraftError> {

  let app_prefs = app_prefs.get_clone()?;

  // TODO: Api should return the extension and suggested filename so we can better construct something.
  let media_file = get_media_file(
    &app_env_configs.storyteller_host,
    &request.media_token,
  ).await?;

  let asset_url = media_file.media_file.media_links.cdn_url;

  let download_path = download_url_to_user_download_dir(
    &asset_url,
    app_data_root,
    &app_prefs
  ).await?;

  info!("downloaded to: {:?}", download_path);

  Ok(())
}
