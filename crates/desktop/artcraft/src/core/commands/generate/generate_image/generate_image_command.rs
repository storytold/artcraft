use crate::core::commands::generate::generate_image::request::{TauriGenerateImageErrorType, TauriGenerateImageRequest, TauriGenerateImageResponse};
use crate::core::commands::response::shorthand::Response;
use log::info;
use tauri::AppHandle;

#[tauri::command]
pub async fn generate_image_command(
  request: TauriGenerateImageRequest,
  app: AppHandle,
) -> Response<TauriGenerateImageResponse, TauriGenerateImageErrorType, ()> {

  info!("generate_image_command called, request: {:?}", request);

  // TODO: Handle request.

  Ok(TauriGenerateImageResponse {}.into())
}
