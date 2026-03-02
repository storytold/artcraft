use crate::core::commands::response::failure_response_wrapper::{CommandErrorResponseWrapper, CommandErrorStatus};
use crate::core::commands::response::shorthand::ResponseOrError;
use crate::core::commands::response::success_response_wrapper::SerializeMarker;
use crate::core::state::app_env_configs::app_env_configs::AppEnvConfigs;
use artcraft_api_defs::generate::cost_estimate::estimate_image_cost::{
  EstimateImageCostError, EstimateImageCostErrorType, EstimateImageCostRequest,
  EstimateImageCostResponse,
};
use log::info;
use artcraft_client::endpoints::generate::cost_estimate::image::estimate_image_cost::estimate_image_cost;
use tauri::State;

impl SerializeMarker for EstimateImageCostResponse {}

#[tauri::command]
pub async fn estimate_image_cost_command(
  request: EstimateImageCostRequest,
  app_env_configs: State<'_, AppEnvConfigs>,
) -> ResponseOrError<EstimateImageCostResponse, EstimateImageCostError> {
  info!("estimate_image_cost_command called");

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
