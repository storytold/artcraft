use crate::core::commands::response::shorthand::ResponseOrErrorMessage;
use crate::core::commands::response::success_response_wrapper::SerializeMarker;
use crate::core::state::data_dir::app_data_root::AppDataRoot;
use crate::core::state::app_env_configs::app_env_configs::AppEnvConfigs;
use crate::core::utils::provider_submission::{uncertain_submissions, UncertainSubmission};
use serde::Serialize;
use tauri::State;

#[derive(Serialize)]
pub struct ListWaveSpeedSubmissionsResponse {
  pub submissions: Vec<UncertainSubmission>,
}
impl SerializeMarker for ListWaveSpeedSubmissionsResponse {}

#[tauri::command]
pub async fn list_wavespeed_submissions_command(root: State<'_, AppDataRoot>, config: State<'_, AppEnvConfigs>) -> ResponseOrErrorMessage<ListWaveSpeedSubmissionsResponse> {
  let submissions = uncertain_submissions(&root, &config.storyteller_host.to_api_hostname_and_scheme()).map_err(|error| error.to_string())?;
  Ok(ListWaveSpeedSubmissionsResponse { submissions }.into())
}
