use crate::core::commands::enqueue::image_to_gaussian::enqueue_image_to_gaussian_command::enqueue_image_to_gaussian_command;
use crate::core::commands::generate::omni::{self, Modality, OmniRequest, OmniResult};
use crate::core::commands::generate::omni::dispatch::{adapt_legacy_response, decode_native};
use tauri::{AppHandle, Manager};

#[tauri::command]
pub async fn generate_splat_command(mut request: OmniRequest, app: AppHandle) -> OmniResult {
  if request.uses_artcraft() {
    return omni::generate(request, Modality::Splat, &app).await;
  }
  if let Some(images) = request.fields.remove("reference_image_media_tokens") {
    request.fields.insert("image_media_tokens".into(), images);
  }
  adapt_legacy_response(enqueue_image_to_gaussian_command(decode_native(request)?, app.clone(), app.state(), app.state(), app.state(), app.state(), app.state(), app.state()).await)
}
