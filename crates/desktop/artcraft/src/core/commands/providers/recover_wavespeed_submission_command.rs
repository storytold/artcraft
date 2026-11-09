use crate::core::commands::response::shorthand::SuccessOrErrorMessage;
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
use sqlite_tasks::queries::get_task_by_provider_and_provider_job_id::{get_task_by_provider_and_provider_job_id, GetTaskByProviderAndProviderJobIdArgs};
use enums::common::generation_provider::GenerationProvider;

#[derive(Deserialize)]
pub struct RecoverWaveSpeedSubmissionRequest {
  pub id: String,
  pub prediction_id: String,
}

#[tauri::command]
pub async fn recover_wavespeed_submission_command(request: RecoverWaveSpeedSubmissionRequest, root: State<'_, AppDataRoot>, config: State<'_, AppEnvConfigs>, database: State<'_, TaskDatabase>, credentials: State<'_, ProviderCredentialLoadingCache>) -> SuccessOrErrorMessage {
  let operation = async {
    let payload = credentials.get_credentials(ProviderCredentialKey::WaveSpeedApiKey)?;
    let Some(ProviderCredentialPayload::ApiKey(key)) = payload else {
      anyhow::bail!("Add your WaveSpeed key before recovering a job");
    };
    let prediction = WaveSpeedClient::new(key.as_str())?.get_prediction(&request.prediction_id).await?;
    anyhow::ensure!(prediction.id == request.prediction_id, "WaveSpeed returned a different prediction");
    let existing = get_task_by_provider_and_provider_job_id(GetTaskByProviderAndProviderJobIdArgs { db: database.get_connection(), provider: GenerationProvider::WaveSpeed, provider_job_id: &prediction.id }).await?;
    anyhow::ensure!(existing.is_none(), "This prediction is already tracked in ArtCraft");
    let host = config.storyteller_host.to_api_hostname_and_scheme();
    attach_prediction(&root, &request.id, &prediction.id, &host)?;
    restore_submissions(&root, &database, &host).await?;
    anyhow::Ok(())
  }
  .await;
  operation.map_err(|error| error.to_string())?;
  Ok(().into())
}
