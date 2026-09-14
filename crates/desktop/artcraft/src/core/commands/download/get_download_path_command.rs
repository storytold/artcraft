use crate::core::state::app_preferences::app_preferences_manager::AppPreferencesManager;
use crate::core::state::data_dir::app_data_root::AppDataRoot;
use crate::core::utils::download_url_to_user_download_dir::suggested_download_filename;
use chrono::Local;
use serde::{Deserialize, Serialize};
use std::path::PathBuf;
use tauri::State;
use url::Url;

#[derive(Deserialize)]
pub struct GetDownloadPathRequest {
  pub url: Url,
  #[serde(rename = "model")]
  pub maybe_model: Option<String>,
  #[serde(rename = "batch_index")]
  pub maybe_batch_index: Option<usize>,
}

#[derive(Serialize)]
pub struct GetDownloadPathResponse {
  pub filename: String,
  pub path: PathBuf,
}

/// Suggest a name for a native save dialog using the same formatter as
/// automatic downloads. The dialog may still let the user override it.
#[tauri::command]
pub fn get_download_path_command(
  request: GetDownloadPathRequest,
  app_prefs: State<'_, AppPreferencesManager>,
  app_data_root: State<'_, AppDataRoot>,
) -> Result<GetDownloadPathResponse, String> {
  let prefs = app_prefs.get_clone().map_err(|err| err.to_string())?;
  let filename = suggested_download_filename(
    &request.url,
    &prefs,
    request.maybe_model.as_deref(),
    request.maybe_batch_index,
    Local::now(),
  );
  let path = prefs
    .preferred_download_directory
    .download_directory(&app_data_root)
    .join(&filename);
  Ok(GetDownloadPathResponse { filename, path })
}
