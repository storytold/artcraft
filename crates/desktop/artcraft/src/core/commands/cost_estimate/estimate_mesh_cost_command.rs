use crate::core::commands::generate::omni::{self, Modality, OmniRequest, OmniResult};
use crate::core::commands::generate::omni::dispatch::local_error;
use tauri::AppHandle;

#[tauri::command]
pub async fn estimate_mesh_cost_command(request: OmniRequest, app: AppHandle) -> OmniResult {
  if matches!(request.provider, Some(GenerationProvider::LocalLlm)) {
    return Ok(OmniResponse(serde_json::json!({
      "success": true, "cost_in_credits": 0, "cost_in_usd_cents": null,
      "is_free": true, "is_unlimited": false, "is_rate_limited": false,
      "has_watermark": false,
    })).into());
  }
  if !request.uses_artcraft() {
    return Err(local_error("No direct provider adapter is configured for this modality."));
  }
  omni::estimate(request, Modality::Mesh, &app).await
}
