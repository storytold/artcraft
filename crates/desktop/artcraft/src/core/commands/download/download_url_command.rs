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
use crate::core::utils::download_url_to_user_download_dir::{download_url_with_filename, save_url_as, suggested_download_filename};
use chrono::{DateTime, Local};
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
  #[serde(rename = "model")]
  pub maybe_model: Option<String>,
  #[serde(rename = "batch_index")]
  pub maybe_batch_index: Option<usize>,
  /// Set only when the user explicitly chooses a folder for a batch download.
  #[serde(rename = "directory")]
  pub maybe_directory: Option<PathBuf>,
  /// Saved under exactly this name instead of the suggested one.
  #[serde(rename = "filename")]
  pub maybe_filename: Option<String>,
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

  let download_path = save_download(&request, &app_prefs, app_data_root, Local::now()).await?;

  info!("downloaded to: {:?}", download_path);

  Ok(())
}

/// A requested filename is saved as exactly that file (the user confirmed it in a save dialog);
/// otherwise the suggested name is used, never replacing an earlier download.
async fn save_download(request: &DownloadUrlRequest, app_prefs: &AppPreferences, app_data_root: &AppDataRoot, now: DateTime<Local>) -> Result<PathBuf, ArtcraftError> {
  let directory = request.maybe_directory.clone().unwrap_or_else(|| app_prefs.preferred_download_directory.download_directory(app_data_root));
  match request.maybe_filename.as_deref() {
    Some(filename) => save_url_as(&request.url, &directory, filename).await,
    None => {
      let filename = suggested_download_filename(&request.url, app_prefs, request.maybe_model.as_deref(), request.maybe_batch_index, now);
      download_url_with_filename(&request.url, &directory, &filename).await
    },
  }
}

#[cfg(test)]
mod tests {
  use super::*;
  use crate::core::utils::local_generations::asset_url;
  use std::path::Path;

  #[tokio::test]
  async fn a_requested_filename_saves_as_exactly_that_file() {
    let dir = tempfile::tempdir().unwrap();
    let (root, target) = (AppDataRoot::create_existing(dir.path()).unwrap(), dir.path().join("Pictures"));
    std::fs::create_dir_all(&target).unwrap();
    std::fs::write(target.join("My fox.png"), b"old").unwrap();
    let request = request(&local_image(dir.path()), &target, Some("My fox.png"));
    let saved = save_download(&request, &AppPreferences::default(), &root, Local::now()).await.unwrap();
    assert_eq!(saved, target.join("My fox.png"));
    assert_eq!(std::fs::read(&saved).unwrap(), b"new", "the file the user confirmed is replaced");
    assert_eq!(std::fs::read_dir(&target).unwrap().count(), 1, "no My fox_1.png beside it");
  }

  #[tokio::test]
  async fn without_a_filename_the_suggested_one_is_used_without_overwriting() {
    let dir = tempfile::tempdir().unwrap();
    let (root, target) = (AppDataRoot::create_existing(dir.path()).unwrap(), dir.path().join("Pictures"));
    let (prefs, now) = (AppPreferences::default(), Local::now());
    let request = request(&local_image(dir.path()), &target, None);
    let suggested = suggested_download_filename(&request.url, &prefs, Some("nano_banana"), None, now);
    std::fs::create_dir_all(&target).unwrap();
    std::fs::write(target.join(&suggested), b"old").unwrap();
    let saved = save_download(&request, &prefs, &root, now).await.unwrap();
    assert_eq!(saved.parent(), Some(target.as_path()));
    assert_ne!(saved, target.join(&suggested), "an earlier download is never replaced");
    assert_eq!(std::fs::read(target.join(&suggested)).unwrap(), b"old");
    assert_eq!(std::fs::read(&saved).unwrap(), b"new");
  }

  fn request(image: &Path, directory: &Path, maybe_filename: Option<&str>) -> DownloadUrlRequest {
    serde_json::from_value(serde_json::json!({
      "url": asset_url(image).unwrap().as_str(),
      "model": "nano_banana",
      "directory": directory,
      "filename": maybe_filename,
    })).unwrap()
  }

  fn local_image(root: &Path) -> PathBuf {
    let folder = root.join("data").join("local_generations");
    std::fs::create_dir_all(&folder).unwrap();
    let path = folder.join("local_file_abc.png");
    std::fs::write(&path, b"new").unwrap();
    path
  }
}
