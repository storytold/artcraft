use enums::tauri::tasks::task_media_file_class::TaskMediaFileClass;
use enums::tauri::tasks::task_type::TaskType;
use log::{error, warn};
use sqlite_tasks::queries::task::Task;
use tauri::AppHandle;
use wavespeed_client::{PredictionStatus, WaveSpeedClient, WaveSpeedError};

use crate::core::providers::credentials::payload::provider_credential_payload::ProviderCredentialPayload;
use crate::core::providers::credentials::provider_credential_key::ProviderCredentialKey;
use crate::core::providers::credentials::provider_credential_loading_cache::ProviderCredentialLoadingCache;
use crate::core::state::app_env_configs::app_env_configs::AppEnvConfigs;
use crate::core::state::data_dir::app_data_root::AppDataRoot;
use crate::core::state::task_database::TaskDatabase;
use crate::core::threads::third_party_task_polling_thread::handlers::handle_provider_failure::handle_provider_failure;
use crate::core::threads::third_party_task_polling_thread::handlers::handle_provider_complete::handle_provider_complete;
use crate::services::storyteller::state::storyteller_credential_manager::StorytellerCredentialManager;

pub async fn poll_wavespeed_tasks(app_handle: &AppHandle, app_env_configs: &AppEnvConfigs, app_data_root: &AppDataRoot, task_database: &TaskDatabase, storyteller_creds_manager: &StorytellerCredentialManager, credential_cache: &ProviderCredentialLoadingCache, tasks: &[&Task]) {
  if tasks.is_empty() {
    return;
  }
  let client = match credential_cache.get_credentials(ProviderCredentialKey::WaveSpeedApiKey) {
    Ok(Some(ProviderCredentialPayload::ApiKey(data))) => match WaveSpeedClient::new(data.as_str()) {
      Ok(client) => client,
      Err(error) => {
        warn!("[WaveSpeedPolling] {error}");
        return;
      },
    },
    _ => return,
  };
  for task in tasks {
    let Some(prediction_id) = task.provider_job_id.as_deref() else {
      handle_provider_failure(app_handle, task_database, task, "Missing WaveSpeed prediction ID").await;
      continue;
    };
    match client.get_prediction(prediction_id).await {
      Ok(prediction) if prediction.status == PredictionStatus::Completed => {
        if prediction.outputs.is_empty() {
          handle_provider_failure(app_handle, task_database, task, "WaveSpeed returned no output media").await;
          continue;
        }
        let media_class = if task.task_type == TaskType::VideoGeneration { TaskMediaFileClass::Video } else { TaskMediaFileClass::Image };
        if let Err(error) = handle_provider_complete(app_handle, app_env_configs, app_data_root, task_database, storyteller_creds_manager, task, prediction.outputs, media_class).await {
          error!("[WaveSpeedPolling] Could not save task {}: {error}", task.id.as_str());
        }
      },
      Ok(prediction) if prediction.status.is_failure() => {
        handle_provider_failure(app_handle, task_database, task, prediction.maybe_error.as_deref().filter(|message| !message.is_empty()).unwrap_or("WaveSpeed generation failed")).await;
      },
      Ok(_) => {},
      Err(WaveSpeedError::Http(404)) => {
        handle_provider_failure(app_handle, task_database, task, "WaveSpeed prediction no longer exists").await;
      },
      Err(error) => warn!("[WaveSpeedPolling] Task {}: {error}", task.id.as_str()),
    }
  }
}
