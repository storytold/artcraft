use enums::tauri::tasks::task_media_file_class::TaskMediaFileClass;
use enums::tauri::tasks::task_type::TaskType;
use log::{error, warn};
use sqlite_tasks::queries::task::Task;
use tauri::AppHandle;
use wavespeed_client::{Prediction, PredictionStatus, WaveSpeedClient, WaveSpeedError};
use futures::{stream, StreamExt};
use std::sync::Mutex;
use std::time::{Duration, Instant};

use crate::core::providers::credentials::payload::provider_credential_payload::ProviderCredentialPayload;
use crate::core::providers::credentials::provider_credential_key::ProviderCredentialKey;
use crate::core::providers::credentials::provider_credential_loading_cache::ProviderCredentialLoadingCache;
use crate::core::state::app_env_configs::app_env_configs::AppEnvConfigs;
use crate::core::state::data_dir::app_data_root::AppDataRoot;
use crate::core::state::task_database::TaskDatabase;
use crate::core::threads::third_party_task_polling_thread::handlers::handle_provider_failure::handle_provider_failure;
use crate::core::threads::third_party_task_polling_thread::handlers::handle_provider_complete::handle_provider_complete;
use crate::services::storyteller::state::storyteller_credential_manager::StorytellerCredentialManager;

static POLL_BACKOFF: Mutex<PollBackoff> = Mutex::new(PollBackoff { failures: 0, maybe_until: None });

struct PollBackoff {
  failures: u32,
  maybe_until: Option<Instant>,
}

enum PollOutcome {
  Completed(Vec<String>),
  Failed(String),
  Pending,
  Retry(WaveSpeedError),
}

impl PollBackoff {
  fn delay(&mut self, maybe_retry_after_secs: Option<u64>) {
    self.failures = self.failures.saturating_add(1);
    let seconds = maybe_retry_after_secs.unwrap_or(2u64.saturating_pow(self.failures.min(8))).clamp(2, 3600);
    self.maybe_until = Some(Instant::now() + Duration::from_secs(seconds));
  }
}

pub async fn poll_wavespeed_tasks(app_handle: &AppHandle, app_env_configs: &AppEnvConfigs, app_data_root: &AppDataRoot, task_database: &TaskDatabase, storyteller_creds_manager: &StorytellerCredentialManager, credential_cache: &ProviderCredentialLoadingCache, tasks: &[&Task]) {
  if tasks.is_empty() {
    return;
  }
  if POLL_BACKOFF.lock().is_ok_and(|backoff| backoff.maybe_until.is_some_and(|until| until > Instant::now())) {
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
  let owned_tasks: Vec<Task> = tasks.iter().map(|task| (*task).clone()).collect();
  let mut results = stream::iter(owned_tasks).map(|task: Task| {
    let client = client.clone();
    async move {
      let result = match task.provider_job_id.as_deref() {
        Some(id) => client.get_prediction(id).await,
        None => Err(WaveSpeedError::InvalidResponse("missing prediction ID")),
      };
      (task, result)
    }
  }).buffer_unordered(4);
  let mut transient_failure = false;
  while let Some((task, result)) = results.next().await {
    let task = &task;
    match poll_outcome(result) {
      PollOutcome::Completed(outputs) => {
        let media_class = if task.task_type == TaskType::VideoGeneration { TaskMediaFileClass::Video } else { TaskMediaFileClass::Image };
        if let Err(error) = handle_provider_complete(app_handle, app_env_configs, app_data_root, task_database, storyteller_creds_manager, task, outputs, media_class).await {
          error!("[WaveSpeedPolling] Could not save task {}: {error}", task.id.as_str());
        }
      },
      PollOutcome::Failed(reason) => {
        handle_provider_failure(app_handle, task_database, task, &reason).await;
      },
      PollOutcome::Pending => {},
      PollOutcome::Retry(WaveSpeedError::RateLimited { maybe_retry_after_secs, .. }) => {
        if let Ok(mut backoff) = POLL_BACKOFF.lock() { backoff.delay(maybe_retry_after_secs); }
        return;
      },
      PollOutcome::Retry(error) => {
        transient_failure = true;
        warn!("[WaveSpeedPolling] Task {}: {error}", task.id.as_str());
      },
    }
  }
  if let Ok(mut backoff) = POLL_BACKOFF.lock() {
    if transient_failure {
      backoff.delay(None);
    } else {
      backoff.failures = 0;
      backoff.maybe_until = None;
    }
  }
}

fn poll_outcome(result: Result<Prediction, WaveSpeedError>) -> PollOutcome {
  match result {
    Ok(prediction) if prediction.status == PredictionStatus::Completed => {
      if prediction.outputs.is_empty() {
        PollOutcome::Failed("WaveSpeed returned no output media".into())
      } else {
        PollOutcome::Completed(prediction.outputs)
      }
    },
    Ok(prediction) if prediction.status.is_failure() => PollOutcome::Failed(prediction.maybe_error.filter(|message| !message.is_empty()).unwrap_or_else(|| "WaveSpeed generation failed".into())),
    Ok(_) => PollOutcome::Pending,
    Err(WaveSpeedError::Http { status: 404, .. } | WaveSpeedError::Api { code: 404, .. }) => PollOutcome::Failed("WaveSpeed prediction no longer exists".into()),
    Err(WaveSpeedError::InvalidResponse("missing prediction ID")) => PollOutcome::Failed("Missing WaveSpeed prediction ID".into()),
    Err(WaveSpeedError::Rejected { message, .. }) => PollOutcome::Failed(message),
    Err(error) => PollOutcome::Retry(error),
  }
}

#[cfg(test)]
mod tests {
  use super::*;

  #[test]
  fn completed_empty_failed_missing_and_transient_predictions_have_distinct_outcomes() {
    let completed = Prediction { id: "job".into(), status: PredictionStatus::Completed, outputs: vec!["https://example.com/result".into()], maybe_error: None };
    assert!(matches!(poll_outcome(Ok(completed.clone())), PollOutcome::Completed(urls) if urls.len() == 1));
    assert!(matches!(poll_outcome(Ok(Prediction { outputs: vec![], ..completed.clone() })), PollOutcome::Failed(message) if message.contains("no output")));
    for status in [PredictionStatus::Failed, PredictionStatus::Cancelled, PredictionStatus::Timeout, PredictionStatus::Deleted] {
      assert!(matches!(poll_outcome(Ok(Prediction { status, maybe_error: Some("provider failure".into()), ..completed.clone() })), PollOutcome::Failed(message) if message == "provider failure"));
    }
    assert!(matches!(poll_outcome(Err(WaveSpeedError::Http { status: 404, message: String::new() })), PollOutcome::Failed(_)));
    assert!(matches!(poll_outcome(Err(WaveSpeedError::Http { status: 503, message: String::new() })), PollOutcome::Retry(_)));
    assert!(matches!(poll_outcome(Ok(Prediction { status: PredictionStatus::Processing, ..completed })), PollOutcome::Pending));
  }

  #[test]
  fn repeated_failures_back_off_and_retry_after_is_honored() {
    let mut backoff = PollBackoff { failures: 0, maybe_until: None };
    backoff.delay(None);
    let first = backoff.maybe_until.unwrap();
    backoff.delay(None);
    assert!(backoff.maybe_until.unwrap() > first);
    backoff.delay(Some(42));
    assert!(backoff.maybe_until.unwrap().duration_since(Instant::now()) > Duration::from_secs(41));
  }
}
