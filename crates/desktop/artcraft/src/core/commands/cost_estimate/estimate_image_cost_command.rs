use enums::common::generation_provider::GenerationProvider;
use crate::core::commands::generate::omni::OmniResponse;
use crate::core::commands::generate::omni::{self, Modality, OmniRequest, OmniResult};
use crate::core::commands::generate::omni::dispatch::{adapt_legacy_response, decode_native};
use tauri::{AppHandle, Manager};
use crate::core::commands::response::failure_response_wrapper::{CommandErrorResponseWrapper, CommandErrorStatus};
use crate::core::commands::response::shorthand::ResponseOrError;
use crate::core::commands::response::success_response_wrapper::SerializeMarker;
use crate::core::state::app_env_configs::app_env_configs::AppEnvConfigs;
use artcraft_api_defs::generate::cost_estimate::estimate_image_cost::{
  EstimateImageCostError, EstimateImageCostErrorType, EstimateImageCostRequest,
  EstimateImageCostResponse,
};
use artcraft_client::endpoints::generate::cost_estimate::image::estimate_image_cost::estimate_image_cost;
use log::{debug, info};
use tauri::State;

impl SerializeMarker for EstimateImageCostResponse {}

#[tauri::command]
pub async fn estimate_image_cost_command(request: OmniRequest, app: AppHandle) -> OmniResult {
  if matches!(request.provider, Some(GenerationProvider::Midjourney)) {
    if !matches!(request.model(), Some("midjourney" | "midjourney_7" | "midjourney_7_niji" | "midjourney_8")) {
      return Err(CommandErrorResponseWrapper {
        status: CommandErrorStatus::BadRequest,
        error_message: Some("This model cannot use a Midjourney account".to_string()),
        error_type: Some("invalid_provider_for_model".to_string()),
        error_details: None,
      });
    }
    // Paid for by the user's Midjourney subscription, with no ArtCraft credit
    // charge. Do not send this estimate to ArtCraft's generation backend.
    return Ok(OmniResponse(serde_json::json!({
      "success": true, "cost_in_credits": 0, "cost_in_usd_cents": null,
      "is_free": false, "is_unlimited": false, "is_rate_limited": true,
      "has_watermark": false,
    })).into());
  }
  if request.uses_artcraft() && !request.uses_legacy_image_endpoint() {
    return omni::estimate(request, Modality::Image, &app).await;
  }
  adapt_legacy_response(estimate_image_cost_native(decode_native(request)?, app.state()).await)
}

async fn estimate_image_cost_native(
  request: EstimateImageCostRequest,
  app_env_configs: State<'_, AppEnvConfigs>,
) -> ResponseOrError<EstimateImageCostResponse, EstimateImageCostError> {
  debug!("estimate_image_cost_command called: {:?}", request);

  let result = estimate_image_cost(
    &app_env_configs.storyteller_host,
    None, // Credentials are not required for this endpoint.
    request,
  )
  .await;

  match result {
    Ok(response) => Ok(response.into()),
    Err(err) => Err(CommandErrorResponseWrapper {
      status: CommandErrorStatus::BadRequest,
      error_message: None,
      error_type: None,
      error_details: Some(EstimateImageCostError {
        success: false,
        error_type: EstimateImageCostErrorType::InvalidInput,
        error_message: err.to_string(),
      }),
    }),
  }
}
