use crate::core::commands::response::shorthand::ResponseOrErrorType;
use crate::core::commands::response::provider_command_error::ProviderCommandError;
use crate::core::commands::response::success_response_wrapper::SerializeMarker;
use crate::core::state::data_dir::app_data_root::AppDataRoot;
use crate::core::state::app_env_configs::app_env_configs::AppEnvConfigs;
use crate::core::utils::provider_submission::{uncertain_submissions, UncertainSubmission};
use serde::Serialize;
use tauri::State;
use crate::core::commands::response::list_page::{list_page, ListPageRequest};

#[derive(Serialize)]
pub struct ListWaveSpeedSubmissionsResponse {
  pub submissions: Vec<UncertainSubmission>,
  pub next_cursor: Option<usize>,
}
impl SerializeMarker for ListWaveSpeedSubmissionsResponse {}

/// List uncertain submission receipts for the current API host without sign-in.
/// Returns a bounded page and next cursor, or a typed storage error.
#[tauri::command]
pub async fn list_wavespeed_submissions_command(request: Option<ListPageRequest>, root: State<'_, AppDataRoot>, config: State<'_, AppEnvConfigs>) -> ResponseOrErrorType<ListWaveSpeedSubmissionsResponse, ProviderCommandError> {
  let mut submissions = uncertain_submissions(&root, &config.storyteller_host.to_api_hostname_and_scheme()).map_err(|error| ProviderCommandError::StorageError.response(error.to_string()))?;
  submissions.sort_by(|left, right| left.id.cmp(&right.id));
  let (submissions, next_cursor) = list_page(submissions, request);
  Ok(ListWaveSpeedSubmissionsResponse { submissions, next_cursor }.into())
}
