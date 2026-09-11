use crate::core::commands::generate::omni::{self, Modality, OmniRequest, OmniResult};
use crate::core::commands::generate::omni::dispatch::local_error;
use tauri::AppHandle;

#[tauri::command]
pub async fn estimate_audio_cost_command(request: OmniRequest, app: AppHandle) -> OmniResult {
  if !request.uses_artcraft() {
    return Err(local_error("No direct provider adapter is configured for this modality."));
  }
  omni::estimate(request, Modality::Audio, &app).await
}
