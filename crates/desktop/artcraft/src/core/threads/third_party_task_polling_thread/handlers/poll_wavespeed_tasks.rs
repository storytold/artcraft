use enums::tauri::tasks::task_media_file_class::TaskMediaFileClass;
use enums::tauri::tasks::task_type::TaskType;
use log::{error, warn};
use sqlite_tasks::queries::task::Task;
use tauri::AppHandle;
use wavespeed_client::{Prediction, PredictionStatus, WaveSpeedClient, WaveSpeedError};
use futures::{stream, StreamExt};
use std::sync::Mutex;
use std::sync::atomic::{AtomicBool, Ordering};
use std::time::{Duration, Instant};
use std::future::Future;

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
  /// Advance exponential polling backoff while honoring bounded provider retry delays.
  fn delay(&mut self, maybe_retry_after_secs: Option<u64>) {
    self.failures = self.failures.saturating_add(1);
    let seconds = maybe_retry_after_secs.unwrap_or(2u64.saturating_pow(self.failures.min(8))).clamp(2, 3600);
    self.maybe_until = Some(Instant::now() + Duration::from_secs(seconds));
  }
}

/// Respect provider-wide backoff, load cached credentials, and poll pending jobs without creation requests.
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
  poll_with_predictions(app_handle, app_env_configs, app_data_root, task_database, storyteller_creds_manager, tasks, &POLL_BACKOFF, |id| {
    let client = client.clone();
    async move { client.get_prediction(&id).await }
  }).await;
}

/// Bound concurrent polling/completion work and stop scheduling new requests after a rate limit.
async fn poll_with_predictions<F, Fut>(app_handle: &AppHandle<impl tauri::Runtime>, app_env_configs: &AppEnvConfigs, app_data_root: &AppDataRoot, task_database: &TaskDatabase, storyteller_creds_manager: &StorytellerCredentialManager, tasks: &[&Task], backoff: &Mutex<PollBackoff>, fetch: F)
where
  F: Fn(String) -> Fut,
  Fut: Future<Output = Result<Prediction, WaveSpeedError>>,
{
  let owned_tasks: Vec<Task> = tasks.iter().map(|task| (*task).clone()).collect();
  let rate_limited = AtomicBool::new(false);
  let mut results = stream::iter(owned_tasks).map(|task: Task| {
    let fetch = &fetch;
    let rate_limited = &rate_limited;
    async move {
      if rate_limited.load(Ordering::Relaxed) { return None; }
      let result = match task.provider_job_id.as_deref() {
        Some(id) => fetch(id.to_owned()).await,
        None => Err(WaveSpeedError::InvalidResponse("missing prediction ID")),
      };
      match poll_outcome(result) {
        PollOutcome::Completed(outputs) => {
          let media_class = if task.task_type == TaskType::VideoGeneration { TaskMediaFileClass::Video } else { TaskMediaFileClass::Image };
          if let Err(error) = handle_provider_complete(app_handle, app_env_configs, app_data_root, task_database, storyteller_creds_manager, &task, outputs, media_class).await {
            error!("[WaveSpeedPolling] Could not save task {}: {error}", task.id.as_str());
          }
          None
        },
        PollOutcome::Failed(reason) => {
          handle_provider_failure(app_handle, task_database, &task, &reason).await;
          None
        },
        PollOutcome::Pending => None,
        PollOutcome::Retry(error) => {
          if matches!(error, WaveSpeedError::RateLimited { .. }) { rate_limited.store(true, Ordering::Relaxed); }
          Some(error)
        },
      }
    }
  }).buffer_unordered(4);
  let mut transient_failure = false;
  let mut maybe_retry_after_secs = None;
  while let Some(maybe_error) = results.next().await {
    if let Some(error) = maybe_error {
      if let WaveSpeedError::RateLimited { maybe_retry_after_secs: Some(seconds), .. } = &error {
        maybe_retry_after_secs = Some(maybe_retry_after_secs.unwrap_or(0).max(*seconds));
      }
      transient_failure = true;
      warn!("[WaveSpeedPolling] {error}");
    }
  }
  if let Ok(mut backoff) = backoff.lock() {
    if transient_failure {
      backoff.delay(maybe_retry_after_secs);
    } else {
      backoff.failures = 0;
      backoff.maybe_until = None;
    }
  }
}

/// Separate completion, terminal failure, pending status, and retryable provider errors.
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
  use super::super::handle_provider_complete::provider_completion_tests::{pending_task, test_app};
  use super::super::provider_upload_checkpoint::{CompletionIdentity, UploadCheckpoint};
  use crate::core::state::data_dir::trait_data_subdir::DataSubdir;
  use artcraft_client::utils::api_host::ApiHost;
  use enums::common::generation_provider::GenerationProvider;
  use enums::tauri::tasks::task_status::TaskStatus;
  use sqlite_tasks::queries::get_task_by_provider_and_provider_job_id::{get_task_by_provider_and_provider_job_id, GetTaskByProviderAndProviderJobIdArgs};

  #[tokio::test]
  async fn rate_limits_stop_scheduling_further_prediction_requests() {
    let directory = tempfile::tempdir().unwrap();
    let root = AppDataRoot::create_existing(directory.path()).unwrap();
    let database = TaskDatabase::connect(&root).await.unwrap();
    let app = test_app(&root);
    let config = AppEnvConfigs { storyteller_host: ApiHost::Localhost { port: 1 } };
    let credentials = StorytellerCredentialManager::initialize_empty(&root);
    let mut tasks = Vec::new();
    for index in 0..20 { tasks.push(pending_task(&database, &format!("limited_{index}")).await); }
    let requests = std::sync::atomic::AtomicUsize::new(0);
    let backoff = Mutex::new(PollBackoff { failures: 0, maybe_until: None });
    poll_with_predictions(app.handle(), &config, &root, &database, &credentials, &tasks.iter().collect::<Vec<_>>(), &backoff, |_| {
      requests.fetch_add(1, Ordering::Relaxed);
      async { Err(WaveSpeedError::RateLimited { http_status: 429, maybe_retry_after_secs: Some(10), message: String::new() }) }
    }).await;
    assert!((1..=4).contains(&requests.load(Ordering::Relaxed)));
    assert!(backoff.lock().unwrap().maybe_until.unwrap() > Instant::now());
  }

  #[tokio::test]
  async fn polling_updates_real_task_states_for_completed_empty_failed_missing_and_transient_predictions() {
    let directory = tempfile::tempdir().unwrap();
    let root = AppDataRoot::create_existing(directory.path()).unwrap();
    let database = TaskDatabase::connect(&root).await.unwrap();
    let app = test_app(&root);
    let config = AppEnvConfigs { storyteller_host: ApiHost::Localhost { port: 1 } };
    let credentials = StorytellerCredentialManager::initialize_empty(&root);
    let mut tasks = Vec::new();
    for job in ["completed", "empty", "failed", "missing", "transient", "pending", "limited"] {
      tasks.push(pending_task(&database, job).await);
    }
    let completed = &tasks[0];
    let url = "https://example.com/result.png".to_owned();
    let path = root.state_dir().path().join(format!("provider_upload_{}.json", completed.id.as_str()));
    UploadCheckpoint::prepare(&path, &CompletionIdentity { task_id: completed.id.to_string(), provider: GenerationProvider::WaveSpeed, maybe_provider_job_id: completed.provider_job_id.clone(), api_host: config.storyteller_host.to_api_hostname_and_scheme(), media_class: TaskMediaFileClass::Image }, &[url.clone()]).unwrap();
    std::fs::create_dir_all(path.with_extension("media")).unwrap();
    image::DynamicImage::new_rgb8(2, 2).save(path.with_extension("media").join("0.png")).unwrap();
    let backoff = Mutex::new(PollBackoff { failures: 0, maybe_until: None });
    poll_with_predictions(app.handle(), &config, &root, &database, &credentials, &tasks.iter().collect::<Vec<_>>(), &backoff, |id| async move {
      match id.as_str() {
        "missing" => Err(WaveSpeedError::Http { status: 404, message: String::new() }),
        "transient" => Err(WaveSpeedError::Http { status: 503, message: String::new() }),
        "limited" => Err(WaveSpeedError::RateLimited { http_status: 429, maybe_retry_after_secs: Some(42), message: String::new() }),
        _ => Ok(Prediction { id: id.clone(), status: match id.as_str() { "failed" => PredictionStatus::Failed, "pending" => PredictionStatus::Processing, _ => PredictionStatus::Completed }, outputs: if id == "completed" { vec!["https://example.com/result.png".into()] } else { vec![] }, maybe_error: None }),
      }
    }).await;
    for task in &tasks {
      let job = task.provider_job_id.as_deref().unwrap();
      let saved = get_task_by_provider_and_provider_job_id(GetTaskByProviderAndProviderJobIdArgs { db: database.get_connection(), provider: GenerationProvider::WaveSpeed, provider_job_id: job }).await.unwrap().unwrap();
      let expected = match job { "completed" => TaskStatus::CompleteSuccess, "transient" | "pending" | "limited" => TaskStatus::Started, _ => TaskStatus::CompleteFailure };
      assert_eq!(saved.status, expected, "{job}");
    }
    assert!(backoff.lock().unwrap().maybe_until.unwrap().duration_since(Instant::now()) > Duration::from_secs(40));
    assert!(!path.exists());
  }

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
