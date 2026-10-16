//! OpenRouter tasks: queued requests are sent (each in its own task, as image models take
//! minutes), finished images uploaded, failures reported. See `OpenRouterJobs`.

use crate::core::providers::credentials::payload::provider_credential_payload::ProviderCredentialPayload;
use crate::core::providers::credentials::provider_credential_key::ProviderCredentialKey;
use crate::core::providers::credentials::provider_credential_loading_cache::ProviderCredentialLoadingCache;
use crate::core::state::app_env_configs::app_env_configs::AppEnvConfigs;
use crate::core::state::data_dir::app_data_root::AppDataRoot;
use crate::core::state::openrouter_jobs::{OpenRouterJobState, OpenRouterJobs};
use crate::core::state::task_database::TaskDatabase;
use crate::core::threads::third_party_task_polling_thread::handlers::openrouter::handle_openrouter_complete::{complete_kept_openrouter_images, handle_openrouter_complete};
use crate::core::threads::third_party_task_polling_thread::handlers::openrouter::handle_openrouter_failure::handle_openrouter_failure;
use crate::services::storyteller::state::storyteller_credential_manager::StorytellerCredentialManager;
use artcraft_router::client::router_client::RouterClient;
use artcraft_router::client::router_openrouter_client::RouterOpenRouterClient;
use artcraft_router::errors::artcraft_router_error::ArtcraftRouterError;
use artcraft_router::errors::provider_error::ProviderError;
use artcraft_router::generate::generate_image::generate_image_response::GenerateImageResponse;
use artcraft_router::generate::generate_image::image_generation_request::ImageGenerationRequest;
use artcraft_router::generate::generate_image::providers::openrouter::request::OpenRouterImageRequestState;
use enums::common::generation_provider::GenerationProvider;
use log::{error, info, warn};
use sqlite_tasks::queries::task::Task;
use std::collections::HashSet;
use tauri::{AppHandle, Manager};

pub const INTERRUPTED_REASON: &str = "ArtCraft closed before OpenRouter finished this generation";
pub const MISSING_KEY_REASON: &str = "Add your OpenRouter API key in Settings to generate with OpenRouter";
pub const BILLING_REASON: &str = "Your OpenRouter account is out of credits. Add credits at openrouter.ai to keep generating.";

pub async fn poll_openrouter_tasks(
  app_handle: &AppHandle,
  app_env_configs: &AppEnvConfigs,
  app_data_root: &AppDataRoot,
  task_database: &TaskDatabase,
  storyteller_creds_manager: &StorytellerCredentialManager,
  credential_cache: &ProviderCredentialLoadingCache,
  openrouter_tasks: &[&Task],
) {
  let jobs = app_handle.state::<OpenRouterJobs>().inner().clone();

  for task in openrouter_tasks {
    let Some(job_id) = task.provider_job_id.as_deref() else {
      handle_openrouter_failure(app_handle, task_database, task, "The task has no OpenRouter job").await;
      continue;
    };

    match jobs.state(job_id) {
      None => handle_openrouter_failure(app_handle, task_database, task, INTERRUPTED_REASON).await,
      Some(OpenRouterJobState::Queued(_)) => start_job(&jobs, job_id, credential_cache),
      Some(OpenRouterJobState::Running) => {},
      Some(OpenRouterJobState::Finished(finished)) => {
        let result = handle_openrouter_complete(
          app_handle,
          app_env_configs,
          app_data_root,
          task_database,
          storyteller_creds_manager,
          &jobs,
          job_id,
          task,
          &finished,
        ).await;
        match result {
          Ok(()) => jobs.remove(job_id),
          Err(err) => error!("[OpenRouterPolling] Uploading results for task {} failed (will retry): {:?}", task.id.as_str(), err),
        }
      },
      Some(OpenRouterJobState::KeptLocally(kept)) => {
        match complete_kept_openrouter_images(app_handle, app_env_configs, task_database, task, &kept).await {
          Ok(()) => jobs.remove(job_id),
          Err(err) => error!("[OpenRouterPolling] Completing kept images for task {} failed (will retry): {:?}", task.id.as_str(), err),
        }
      },
      Some(OpenRouterJobState::Failed(reason)) => {
        handle_openrouter_failure(app_handle, task_database, task, &reason).await;
        jobs.remove(job_id);
      },
    }
  }
}

/// Drops settled jobs whose task was dismissed or cleared (see `OpenRouterJobs::prune`). Runs
/// every pass, even with no OpenRouter tasks left.
pub fn prune_openrouter_jobs(app_handle: &AppHandle, pending_tasks: &[Task]) {
  let pending_job_ids = pending_tasks.iter()
    .filter(|task| task.provider == GenerationProvider::OpenRouter)
    .filter_map(|task| task.provider_job_id.as_deref())
    .collect::<HashSet<_>>();
  let pruned = app_handle.state::<OpenRouterJobs>().prune(&pending_job_ids);
  if !pruned.is_empty() {
    info!("[OpenRouterPolling] Dropped {} job(s) whose task is gone: {:?}", pruned.len(), pruned);
  }
}

/// Sends a queued job's requests in the background; the result lands back in `jobs`.
fn start_job(jobs: &OpenRouterJobs, job_id: &str, credential_cache: &ProviderCredentialLoadingCache) {
  let Some(requests) = jobs.start(job_id) else {
    return;
  };
  let Some(api_key) = load_openrouter_api_key(credential_cache) else {
    warn!("[OpenRouterPolling] No OpenRouter API key configured for job {}", job_id);
    jobs.fail(job_id, MISSING_KEY_REASON.to_string());
    return;
  };

  info!("[OpenRouterPolling] Sending job {} ({} request(s))", job_id, requests.len());

  let prompt = requests.first().map(|r| r.prompt.clone()).unwrap_or_default();
  let (jobs, job_id) = (jobs.clone(), job_id.to_string());
  tauri::async_runtime::spawn(async move {
    let client = RouterClient::OpenRouter(RouterOpenRouterClient::new_from_raw_key(&api_key));
    let request = ImageGenerationRequest::OpenRouter(OpenRouterImageRequestState { requests });
    match request.send_request(&client).await {
      Ok(GenerateImageResponse::OpenRouter(payload)) => {
        info!("[OpenRouterPolling] Job {} made {} image(s)", job_id, payload.images.len());
        jobs.finish(&job_id, prompt, payload.images);
      },
      Ok(other) => jobs.fail(&job_id, format!("Unexpected OpenRouter response: {:?}", other)),
      Err(err) => {
        warn!("[OpenRouterPolling] Job {} failed: {:?}", job_id, err);
        jobs.fail(&job_id, failure_reason(&err));
      },
    }
  });
}

/// What the user sees: billing problems point at their OpenRouter account.
fn failure_reason(err: &ArtcraftRouterError) -> String {
  match err {
    ArtcraftRouterError::ProviderBillingError(_) => BILLING_REASON.to_string(),
    ArtcraftRouterError::Provider(ProviderError::OpenRouter(err)) => err.user_message(),
    other => other.to_string(),
  }
}

fn load_openrouter_api_key(credential_cache: &ProviderCredentialLoadingCache) -> Option<String> {
  match credential_cache.get_credentials(ProviderCredentialKey::OpenRouterApiKey) {
    Ok(Some(ProviderCredentialPayload::ApiKey(data))) if !data.as_str().is_empty() => Some(data.as_str().to_string()),
    _ => None,
  }
}
