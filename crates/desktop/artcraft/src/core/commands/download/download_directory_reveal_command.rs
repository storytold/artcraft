use crate::core::api_adapters::aspect_ratio::common_aspect_ratio::CommonAspectRatio;
use crate::core::artcraft_error::ArtcraftError;
use crate::core::commands::response::failure_response_wrapper::{CommandErrorResponseWrapper, CommandErrorStatus};
use crate::core::commands::response::shorthand::{Response, ResponseOrErrorMessage, ResponseOrErrorType};
use crate::core::commands::response::success_response_wrapper::SerializeMarker;
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
use tauri_plugin_opener::OpenerExt;
use tokens::tokens::media_files::MediaFileToken;

#[derive(Serialize)]
pub struct DownloadDirectoryRevealSuccessResponse {
}

impl SerializeMarker for DownloadDirectoryRevealSuccessResponse {}

#[tauri::command]
pub async fn download_directory_reveal_command(
  app: AppHandle,
  app_prefs: State<'_, AppPreferencesManager>,
  app_data_root: State<'_, AppDataRoot>,
) -> ResponseOrErrorMessage<DownloadDirectoryRevealSuccessResponse> {

  info!("download_directory_reveal_command called");

  let result = handle_request(
    &app,
    &app_prefs,
    &app_data_root,
  ).await;

  if let Err(err) = result {
    format!("Error revealing download dir: {:?}", err);
    return Err("error revealing download dir".into())
  }

  Ok(DownloadDirectoryRevealSuccessResponse {}.into())
}


pub async fn handle_request(
  app: &AppHandle,
  app_prefs: &AppPreferencesManager,
  app_data_root: &AppDataRoot,
) -> Result<(), ArtcraftError> {

  let app_prefs = app_prefs.get_clone()?;

  let download_directory = app_prefs
      .preferred_download_directory
      .download_directory(app_data_root);

  info!("Revealing item in directory: {:?}", download_directory);

  app.opener().reveal_item_in_dir(download_directory)
      .map_err(|err| anyhow!("Failed to open directory: {:?}", err))?;

  Ok(())
}
