use crate::core::commands::response::failure_response_wrapper::{CommandErrorResponseWrapper, CommandErrorStatus};
use crate::core::commands::response::shorthand::ResponseOrError;
use crate::core::commands::response::success_response_wrapper::SerializeMarker;
use crate::core::state::app_env_configs::app_env_configs::AppEnvConfigs;
use crate::services::storyteller::state::storyteller_credential_manager::StorytellerCredentialManager;
use artcraft_api_defs::generate::cost_estimate::estimate_video_cost::{
  EstimateVideoCostError, EstimateVideoCostErrorType, EstimateVideoCostRequest,
  EstimateVideoCostResponse,
};
use log::info;
use storyteller_client::endpoints::generate::cost_estimate::video::estimate_video_cost::estimate_video_cost;
use tauri::State;

impl SerializeMarker for EstimateVideoCostResponse {}

#[tauri::command]
pub async fn estimate_video_cost_command(
  request: EstimateVideoCostRequest,
  app_env_configs: State<'_, AppEnvConfigs>,
  storyteller_creds_manager: State<'_, StorytellerCredentialManager>,
) -> ResponseOrError<EstimateVideoCostResponse, EstimateVideoCostError> {
  info!("estimate_video_cost_command called");

  let creds = storyteller_creds_manager
    .get_credentials()
    .map_err(|e| CommandErrorResponseWrapper {
      status: CommandErrorStatus::Unauthorized,
      error_message: Some(e.to_string()),
      error_type: None,
      error_details: None,
    })?;

  let result = estimate_video_cost(
    &app_env_configs.storyteller_host,
    creds.as_ref(),
    request,
  )
  .await;

  match result {
    Ok(response) => Ok(response.into()),
    Err(err) => Err(CommandErrorResponseWrapper {
      status: CommandErrorStatus::BadRequest,
      error_message: None,
      error_type: None,
      error_details: Some(EstimateVideoCostError {
        success: false,
        error_type: EstimateVideoCostErrorType::InvalidInput,
        error_message: err.to_string(),
      }),
    }),
  }
}
