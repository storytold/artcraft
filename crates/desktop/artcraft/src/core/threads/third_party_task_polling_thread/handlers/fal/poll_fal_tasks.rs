use crate::core::providers::credentials::provider_credential_loading_cache::ProviderCredentialLoadingCache;
use crate::core::providers::credentials::payload::provider_credential_payload::ProviderCredentialPayload;
use crate::core::providers::credentials::provider_credential_key::ProviderCredentialKey;
use crate::core::state::app_env_configs::app_env_configs::AppEnvConfigs;
use crate::core::state::data_dir::app_data_root::AppDataRoot;
use crate::core::state::task_database::TaskDatabase;
use crate::core::threads::third_party_task_polling_thread::handlers::fal::handle_fal_complete::handle_fal_complete;
use crate::core::threads::third_party_task_polling_thread::handlers::fal::handle_fal_failure::handle_fal_failure;
use crate::services::storyteller::state::storyteller_credential_manager::StorytellerCredentialManager;
use enums::tauri::tasks::task_status::TaskStatus;
use fal_client::creds::fal_api_key::FalApiKey;
use fal_client::polling::poll_job_response::poll_job_response::{poll_job_response, PollJobResponseArgs};
use fal_client::polling::poll_job_status::poll_job_status::{poll_job_status, FalJobStatus, PollJobStatusArgs};
use log::{error, info, warn};
use sqlite_tasks::queries::task::Task;
use sqlite_tasks::queries::update_task_status::{update_task_status, UpdateTaskArgs};
use tauri::AppHandle;

pub async fn poll_fal_tasks(
  app_handle: &AppHandle,
  app_env_configs: &AppEnvConfigs,
  app_data_root: &AppDataRoot,
  task_database: &TaskDatabase,
  storyteller_creds_manager: &StorytellerCredentialManager,
  credential_cache: &ProviderCredentialLoadingCache,
  fal_tasks: &[&Task],
) {
  let api_key = match load_fal_api_key(credential_cache) {
    Some(key) => key,
    None => {
      warn!("[FalPolling] No FAL API key configured, skipping poll");
      return;
    }
  };

  for task in fal_tasks {
    let result = poll_single_fal_task(
      app_handle,
      app_env_configs,
      app_data_root,
      task_database,
      storyteller_creds_manager,
      &api_key,
      task,
    ).await;

    if let Err(err) = result {
      error!(
        "[FalPolling] Error processing task {}: {:?}",
        task.id.as_str(),
        err,
      );
    }
  }
}

async fn poll_single_fal_task(
  app_handle: &AppHandle,
  app_env_configs: &AppEnvConfigs,
  app_data_root: &AppDataRoot,
  task_database: &TaskDatabase,
  storyteller_creds_manager: &StorytellerCredentialManager,
  api_key: &FalApiKey,
  task: &Task,
) -> Result<(), Box<dyn std::error::Error>> {
  let status_url = match &task.queue_status_url {
    Some(url) => url.as_str(),
    None => {
      warn!("[FalPolling] Task {} has no queue_status_url, marking as failed", task.id.as_str());
      handle_fal_failure(
        app_handle,
        task_database,
        task,
        "No queue status URL to check",
      ).await;
      return Ok(());
    }
  };

  // Step 1: Check job status
  info!("[FalPolling] Checking status for task {}: {}", task.id.as_str(), status_url);

  let status_response = poll_job_status(PollJobStatusArgs {
    status_url,
    api_key,
  }).await?;

  match status_response.status {
    FalJobStatus::InQueue | FalJobStatus::InProgress => {
      info!(
        "[FalPolling] Task {} still {:?} (queue_position={:?})",
        task.id.as_str(),
        status_response.status,
        status_response.maybe_queue_position,
      );
      return Ok(());
    }
    FalJobStatus::Unknown(ref status) => {
      warn!("[FalPolling] Task {} has unknown status: {}", task.id.as_str(), status);
      return Ok(());
    }
    FalJobStatus::Completed => {
      info!("[FalPolling] Task {} completed, fetching results...", task.id.as_str());
    }
  }

  // Step 2: Fetch the response
  let response_url = pick_response_url(task, &status_response.response_url);

  let response_url = match response_url {
    Some(url) => url,
    None => {
      warn!("[FalPolling] Task {} completed but has no response URL, marking as failed", task.id.as_str());
      handle_fal_failure(
        app_handle,
        task_database,
        task,
        "Job completed but no response URL available",
      ).await;
      return Ok(());
    }
  };

  let job_response = match poll_job_response(PollJobResponseArgs {
    response_url: &response_url,
    api_key,
  }).await {
    Ok(response) => response,
    Err(err) => {
      error!(
        "[FalPolling] Failed to fetch response for task {}: {}. Skipping for now.",
        task.id.as_str(),
        err,
      );
      return Ok(());
    }
  };

  // Step 3: Handle completed job
  handle_fal_complete(
    app_handle,
    app_env_configs,
    app_data_root,
    task_database,
    storyteller_creds_manager,
    task,
    job_response,
  ).await;

  Ok(())
}

// ── Helpers ──

fn load_fal_api_key(credential_cache: &ProviderCredentialLoadingCache) -> Option<FalApiKey> {
  match credential_cache.get_credentials(ProviderCredentialKey::FalApiKey) {
    Ok(Some(ProviderCredentialPayload::ApiKey(data))) => {
      Some(FalApiKey::from_str(data.as_str()))
    }
    _ => None,
  }
}

/// Use the task's stored response URL first; fall back to the one from the status poll.
/// Log if they differ.
fn pick_response_url(task: &Task, polled_response_url: &Option<String>) -> Option<String> {
  match (&task.queue_response_url, polled_response_url) {
    (Some(db_url), Some(polled_url)) => {
      if db_url != polled_url {
        warn!(
          "[FalPolling] Task {} response URLs differ: db={}, polled={}. Using db URL.",
          task.id.as_str(),
          db_url,
          polled_url,
        );
      }
      Some(db_url.clone())
    }
    (Some(db_url), None) => Some(db_url.clone()),
    (None, Some(polled_url)) => Some(polled_url.clone()),
    (None, None) => None,
  }
}
