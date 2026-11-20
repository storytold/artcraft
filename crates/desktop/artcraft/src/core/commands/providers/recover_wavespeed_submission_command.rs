use crate::core::commands::response::shorthand::ResponseOrErrorType;
use crate::core::commands::response::provider_command_error::ProviderCommandError;
use crate::core::state::data_dir::app_data_root::AppDataRoot;
use crate::core::state::app_env_configs::app_env_configs::AppEnvConfigs;
use crate::core::state::task_database::TaskDatabase;
use crate::core::providers::credentials::provider_credential_loading_cache::ProviderCredentialLoadingCache;
use crate::core::providers::credentials::provider_credential_key::ProviderCredentialKey;
use crate::core::providers::credentials::payload::provider_credential_payload::ProviderCredentialPayload;
use crate::core::utils::provider_submission::{attach_prediction, restore_submissions};
use serde::Deserialize;
use tauri::State;
use wavespeed_client::WaveSpeedClient;
use wavespeed_client::Prediction;
use crate::core::providers::credentials::payload::api_key::ApiKeyData;
use crate::core::commands::response::failure_response_wrapper::CommandErrorResponseWrapper;
use sqlite_tasks::queries::get_task_by_provider_and_provider_job_id::{get_task_by_provider_and_provider_job_id, GetTaskByProviderAndProviderJobIdArgs};
use enums::common::generation_provider::GenerationProvider;

#[derive(Deserialize)]
pub struct RecoverWaveSpeedSubmissionRequest {
  pub id: String,
  pub prediction_id: String,
}

/// Recover a receipt by prediction ID using the saved WaveSpeed key, without a
/// paid creation request or ArtCraft login. Returns typed missing-key,
/// invalid-input, already-tracked, provider, or storage errors.
#[tauri::command]
pub async fn recover_wavespeed_submission_command(request: RecoverWaveSpeedSubmissionRequest, root: State<'_, AppDataRoot>, config: State<'_, AppEnvConfigs>, database: State<'_, TaskDatabase>, credentials: State<'_, ProviderCredentialLoadingCache>) -> ResponseOrErrorType<(), ProviderCommandError> {
  let payload = credentials.get_credentials(ProviderCredentialKey::WaveSpeedApiKey).map_err(|error| ProviderCommandError::StorageError.response(error.to_string()))?;
  let key = require_key(payload)?;
  let client = WaveSpeedClient::new(key.as_str()).map_err(|error| ProviderCommandError::ProviderError.response(error.to_string()))?;
  let prediction = client.get_prediction(&request.prediction_id).await.map_err(|error| ProviderCommandError::ProviderError.response(error.to_string()))?;
  attach_existing_prediction(&request, prediction, &root, &config, &database).await?;
  Ok(().into())
}

/// Reject mismatched or already-tracked prediction IDs before attaching a saved receipt.
async fn attach_existing_prediction(request: &RecoverWaveSpeedSubmissionRequest, prediction: Prediction, root: &AppDataRoot, config: &AppEnvConfigs, database: &TaskDatabase) -> Result<(), CommandErrorResponseWrapper<ProviderCommandError, ()>> {
  if prediction.id != request.prediction_id {
    return Err(ProviderCommandError::InvalidInput.response("WaveSpeed returned a different prediction"));
  }
  let existing = get_task_by_provider_and_provider_job_id(GetTaskByProviderAndProviderJobIdArgs { db: database.get_connection(), provider: GenerationProvider::WaveSpeed, provider_job_id: &prediction.id }).await.map_err(|error| ProviderCommandError::StorageError.response(error.to_string()))?;
  if existing.is_some() {
    return Err(ProviderCommandError::AlreadyTracked.response("This prediction is already tracked in ArtCraft"));
  }
  let host = config.storyteller_host.to_api_hostname_and_scheme();
  attach_prediction(root, &request.id, &prediction.id, &host).map_err(|error| ProviderCommandError::InvalidInput.response(error.to_string()))?;
  restore_submissions(root, database, &host).await.map_err(|error| ProviderCommandError::StorageError.response(error.to_string()))?;
  Ok(())
}

/// Require a WaveSpeed API key and return the shared typed missing-key command error otherwise.
fn require_key(payload: Option<ProviderCredentialPayload>) -> Result<ApiKeyData, CommandErrorResponseWrapper<ProviderCommandError, ()>> {
  match payload {
    Some(ProviderCredentialPayload::ApiKey(key)) => Ok(key),
    _ => Err(ProviderCommandError::MissingApiKey.response("Add your WaveSpeed key before recovering a job")),
  }
}

#[cfg(test)]
mod tests {
  use super::*;
  use artcraft_client::utils::api_host::ApiHost;
  use enums::tauri::tasks::{task_status::TaskStatus, task_type::TaskType};
  use sqlite_tasks::queries::create_task::{create_task, CreateTaskArgs};
  use wavespeed_client::PredictionStatus;

  #[tokio::test]
  async fn rejects_missing_key_mismatched_prediction_and_already_tracked_jobs() {
    assert!(matches!(require_key(None), Err(error) if error.error_type == Some(ProviderCommandError::MissingApiKey)));
    let temporary = tempfile::tempdir().unwrap();
    let root = AppDataRoot::create_existing(temporary.path()).unwrap();
    let database = TaskDatabase::connect(&root).await.unwrap();
    let config = AppEnvConfigs { storyteller_host: ApiHost::Storyteller };
    let request = RecoverWaveSpeedSubmissionRequest { id: "receipt".into(), prediction_id: "job_one".into() };
    let prediction = Prediction { id: "different".into(), status: PredictionStatus::Processing, outputs: vec![], maybe_error: None };
    let error = attach_existing_prediction(&request, prediction, &root, &config, &database).await.unwrap_err();
    assert_eq!(error.error_type, Some(ProviderCommandError::InvalidInput));
    create_task(CreateTaskArgs { db: database.get_connection(), status: TaskStatus::Pending, task_type: TaskType::VideoGeneration, model_type: None, provider: GenerationProvider::WaveSpeed, provider_job_id: Some("job_one"), queue_status_url: None, queue_response_url: None, prompt_token: None, frontend_caller: None, frontend_subscriber_id: None, frontend_subscriber_payload: None }).await.unwrap();
    let prediction = Prediction { id: "job_one".into(), status: PredictionStatus::Processing, outputs: vec![], maybe_error: None };
    let error = attach_existing_prediction(&request, prediction, &root, &config, &database).await.unwrap_err();
    assert_eq!(error.error_type, Some(ProviderCommandError::AlreadyTracked));
  }
}
