//! The images kept on this computer (made without an ArtCraft account), for the library and the
//! create pages to show beside, or instead of, the cloud library.

use crate::core::commands::response::shorthand::ResponseOrErrorMessage;
use crate::core::commands::response::success_response_wrapper::SerializeMarker;
use crate::core::state::data_dir::app_data_root::AppDataRoot;
use crate::core::utils::local_generations::asset_url;
use local_generations::list;
use log::warn;
use serde_derive::Serialize;
use tauri::State;

#[derive(Serialize)]
pub struct ListLocalGenerationsResponse {
  /// Newest first.
  pub images: Vec<LocalGenerationItem>,
}

#[derive(Serialize)]
pub struct LocalGenerationItem {
  /// `local_file_<uuid>`; stands in for a media token.
  pub id: String,
  /// The asset protocol URL the webview loads the image from.
  pub url: String,
  pub prompt: String,
  pub model_id: String,
  pub provider: String,
  /// RFC 3339.
  pub created_at: String,
}

impl SerializeMarker for ListLocalGenerationsResponse {}

#[tauri::command]
pub async fn list_local_generations_command(
  app_data_root: State<'_, AppDataRoot>,
) -> ResponseOrErrorMessage<ListLocalGenerationsResponse> {
  let images = list(app_data_root.path()).into_iter()
    .filter_map(|image| {
      let url = asset_url(&image.path).map_err(|err| warn!("No asset URL for {:?}: {:?}", image.path, err)).ok()?;
      let created_at = chrono::DateTime::from_timestamp(image.created_at, 0).unwrap_or_default().to_rfc3339();
      Some(LocalGenerationItem { id: image.id, url: url.to_string(), prompt: image.prompt, model_id: image.model_id, provider: image.provider, created_at })
    })
    .collect();
  Ok(ListLocalGenerationsResponse { images }.into())
}
