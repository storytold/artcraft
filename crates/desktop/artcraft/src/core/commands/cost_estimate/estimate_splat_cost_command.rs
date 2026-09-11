use crate::core::commands::generate::omni::{self, Modality, OmniRequest, OmniResult};
use crate::core::commands::generate::omni::dispatch::{adapt_legacy_response, decode_native};
use tauri::{AppHandle, Manager};
use crate::core::commands::response::failure_response_wrapper::{CommandErrorResponseWrapper, CommandErrorStatus};
use crate::core::commands::response::shorthand::ResponseOrError;
use crate::core::commands::response::success_response_wrapper::SerializeMarker;
use crate::core::state::app_env_configs::app_env_configs::AppEnvConfigs;
use artcraft_api_defs::generate::cost_estimate::estimate_splat_cost::{
  EstimateSplatCostError, EstimateSplatCostErrorType, EstimateSplatCostRequest,
  EstimateSplatCostResponse,
};
use artcraft_client::endpoints::generate::cost_estimate::splat::estimate_splat_cost::estimate_splat_cost;
use log::debug;
use tauri::State;

impl SerializeMarker for EstimateSplatCostResponse {}

#[tauri::command]
pub async fn estimate_splat_cost_command(request: OmniRequest, app: AppHandle) -> OmniResult {
  if request.uses_artcraft() {
    return omni::estimate(request, Modality::Splat, &app).await;
  }
  adapt_legacy_response(estimate_splat_cost_native(decode_native(request)?, app.state()).await)
}

async fn estimate_splat_cost_native(
  request: EstimateSplatCostRequest,
  app_env_configs: State<'_, AppEnvConfigs>,
) -> ResponseOrError<EstimateSplatCostResponse, EstimateSplatCostError> {
  debug!("estimate_splat_cost_command called");

  let result = estimate_splat_cost(
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
      error_details: Some(EstimateSplatCostError {
        success: false,
        error_type: EstimateSplatCostErrorType::InvalidInput,
        error_message: err.to_string(),
      }),
    }),
  }
}
