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
use crate::core::utils::download_url_to_user_download_dir::{check_url_file_name_for_downloadability, download_url_with_filename, persist_download, suggested_download_filename};
use crate::core::utils::local_generations;
use chrono::Local;
use anyhow::anyhow;
use log::{error, info};
use serde_derive::{Deserialize, Serialize};
use std::path::{Path, PathBuf};
use std::str::FromStr;
use artcraft_client::endpoints::media_files::get_media_file::get_media_file;
use tauri::{AppHandle, State};
use url::Url;
use tempfile::NamedTempFile;

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
  #[serde(rename = "filename")]
  pub maybe_filename: Option<String>,
}

#[derive(Serialize)]
pub struct DownloadUrlSuccessResponse {}

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
      },
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
  download_with_preferences(request, &app_prefs, app_data_root).await?;
  Ok(())
}

async fn download_with_preferences(request: DownloadUrlRequest, app_prefs: &AppPreferences, app_data_root: &AppDataRoot) -> Result<PathBuf, ArtcraftError> {

  let maybe_source = if local_generations::is_asset_url(&request.url) { Some(local_generations::resolve_asset_url(app_data_root, &request.url)?) } else { None };
  if request.maybe_filename.is_some() && maybe_source.is_none() {
    return Err(anyhow!("Explicit filenames are only supported for local generations").into());
  }
  let naming_url = match &maybe_source {
    Some(source) => Url::from_file_path(source).map_err(|_| anyhow!("Invalid local generation path"))?,
    None => request.url.clone(),
  };
  let explicit_filename = request.maybe_filename.is_some();
  let filename = request.maybe_filename.unwrap_or_else(|| suggested_download_filename(&naming_url, &app_prefs, request.maybe_model.as_deref(), request.maybe_batch_index, Local::now()));
  check_url_file_name_for_downloadability(&filename)?;
  let directory = request.maybe_directory.unwrap_or_else(|| app_prefs.preferred_download_directory.download_directory(app_data_root));
  let download_path = match maybe_source {
    Some(source) => tauri::async_runtime::spawn_blocking(move || copy_local_image(&source, &directory, &filename, explicit_filename)).await.map_err(|error| anyhow!(error))??,
    None => download_url_with_filename(&request.url, &directory, &filename).await?,
  };

  info!("downloaded to: {:?}", download_path);

  Ok(download_path)
}

fn copy_local_image(source: &Path, directory: &Path, filename: &str, explicit_filename: bool) -> Result<PathBuf, ArtcraftError> {
  check_url_file_name_for_downloadability(filename)?;
  if explicit_filename {
    let extension = Path::new(filename).extension().and_then(|value| value.to_str()).unwrap_or_default().to_ascii_lowercase();
    if !matches!(extension.as_str(), "png" | "jpg" | "jpeg" | "webp" | "gif" | "mp4") {
      return Err(ArtcraftError::BadDownloadFilename { path: filename.into() });
    }
  }
  std::fs::create_dir_all(directory)?;
  let mut temporary = NamedTempFile::new_in(directory)?;
  let mut input = std::fs::File::open(source)?;
  std::io::copy(&mut input, &mut temporary)?;
  temporary.as_file().sync_all()?;
  if !explicit_filename {
    return persist_download(temporary, directory, filename);
  }
  let path = directory.join(filename);
  temporary.persist_noclobber(&path).map_err(|error| if error.error.kind() == std::io::ErrorKind::AlreadyExists { ArtcraftError::CannotDownloadFilePathAlreadyExists { path: path.clone() } } else { error.error.into() })?;
  Ok(path)
}

#[cfg(test)]
mod tests {
  use super::*;

  #[tokio::test]
  async fn explicit_names_reject_remote_urls_and_copy_registered_local_assets() {
    let temporary = tempfile::tempdir().unwrap();
    let root = AppDataRoot::create_existing(temporary.path()).unwrap();
    let destination = temporary.path().join("chosen");
    let request = DownloadUrlRequest { url: Url::parse("https://example.com/image.png").unwrap(), maybe_model: None, maybe_batch_index: None, maybe_directory: Some(destination.clone()), maybe_filename: Some("saved.png".into()) };
    assert!(download_with_preferences(request, &AppPreferences::default(), &root).await.is_err());
    assert!(!destination.exists());
    let source = temporary.path().join("source.png");
    image::DynamicImage::new_rgb8(2, 2).save(&source).unwrap();
    let local = local_generations::keep_as(&root, "download", &source, "a wave", "flux_1_dev", "wavespeed").unwrap();
    let request = DownloadUrlRequest { url: local.asset_url, maybe_model: None, maybe_batch_index: None, maybe_directory: Some(destination.clone()), maybe_filename: Some("saved.png".into()) };
    let saved = download_with_preferences(request, &AppPreferences::default(), &root).await.unwrap();
    assert_eq!(saved, destination.join("saved.png"));
    assert_eq!(std::fs::read(saved).unwrap(), std::fs::read(source).unwrap());
  }

  #[test]
  fn local_save_as_refuses_executable_or_unsafe_filenames() {
    let directory = tempfile::tempdir().unwrap();
    let source = directory.path().join("source.png");
    std::fs::write(&source, b"image bytes").unwrap();
    let destination = directory.path().join("downloads");
    for filename in ["evil.exe", "EVIL.EXE", "evil.dll", "run.sh", "run.ps1", "../image.png", "image:stream.png", "a\0.png"] {
      assert!(copy_local_image(&source, &destination, filename, true).is_err(), "{filename:?}");
    }
    assert!(!destination.exists());
  }

  #[test]
  fn local_save_as_copies_bytes_without_overwriting_existing_files() {
    let directory = tempfile::tempdir().unwrap();
    let source = directory.path().join("source.png");
    std::fs::write(&source, b"image bytes").unwrap();
    let destination = directory.path().join("downloads");
    let output = copy_local_image(&source, &destination, "image.png", true).unwrap();
    assert_eq!(std::fs::read(&output).unwrap(), b"image bytes");
    std::fs::write(&output, b"existing data").unwrap();
    assert!(matches!(copy_local_image(&source, &destination, "image.png", true), Err(ArtcraftError::CannotDownloadFilePathAlreadyExists { .. })));
    assert_eq!(std::fs::read(&output).unwrap(), b"existing data");
    let renamed = copy_local_image(&source, &destination, "image.png", false).unwrap();
    assert_eq!(renamed.file_name().unwrap(), "image_1.png");
  }
}
