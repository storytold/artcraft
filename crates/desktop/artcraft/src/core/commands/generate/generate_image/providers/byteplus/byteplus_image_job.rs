use std::collections::HashSet;
use std::sync::{LazyLock, Mutex};

use byteplus_ark_client::creds::ark_api_key::ArkApiKey;
use byteplus_ark_client::error::ark_api_error::ArkApiError;
use byteplus_ark_client::error::ark_error::ArkError;
use byteplus_ark_client::requests::images::image_generation::{
  generate_images, ImageGenerationRequest, ImageGenerationResponse, ImageResponseFormat,
};
use enums::common::generation_provider::GenerationProvider;
use enums::tauri::tasks::task_failure_type::TaskFailureType;
use enums::tauri::tasks::task_media_file_class::TaskMediaFileClass;
use futures::future::join_all;
use log::{error, info, warn};
use sqlite_tasks::queries::get_task_by_provider_and_provider_job_id::{
  get_task_by_provider_and_provider_job_id, GetTaskByProviderAndProviderJobIdArgs,
};
use tauri::{AppHandle, Manager};

use crate::core::commands::generate::byteplus::byteplus_common::failure_type_for;
use crate::core::state::task_database::TaskDatabase;
use crate::core::threads::third_party_task_polling_thread::handlers::byteplus::handle_byteplus_complete::{
  handle_byteplus_complete, ByteplusResult,
};
use crate::core::threads::third_party_task_polling_thread::handlers::byteplus::handle_byteplus_failure::handle_byteplus_failure;

/// Seedream jobs running in this app session, by provider job id. A pending Seedream task that
/// isn't here was left behind when the app quit.
static RUNNING_SEEDREAM_JOBS: LazyLock<Mutex<HashSet<String>>> = LazyLock::new(|| Mutex::new(HashSet::new()));

/// A Seedream generation whose task has been recorded but not yet run.
pub struct ByteplusImageJob {
  pub provider_job_id: String,
  /// Keeps the job listed as running until the job is dropped.
  pub running: RunningSeedreamJob,
  pub api_key: ArkApiKey,
  pub ark_model_id: &'static str,
  pub prompt: String,
  /// `2K`, `4K` or `<width>x<height>`.
  pub size: String,
  /// Public links or `data:` URLs.
  pub reference_images: Vec<String>,
  pub image_count: u32,
}

/// Generates the images (one Seedream request per image, in parallel) and completes the task.
/// When only some images succeed, the task completes with those.
pub async fn run_byteplus_image_job(app: AppHandle, job: ByteplusImageJob) {
  let maybe_task = get_task_by_provider_and_provider_job_id(GetTaskByProviderAndProviderJobIdArgs {
    db: app.state::<TaskDatabase>().get_connection(),
    provider: GenerationProvider::Byteplus,
    provider_job_id: &job.provider_job_id,
  }).await;

  let task = match maybe_task {
    Ok(Some(task)) => task,
    Ok(None) => {
      error!("[BytePlusImage] No task recorded for job {}; not generating", job.provider_job_id);
      return;
    }
    Err(err) => {
      error!("[BytePlusImage] Could not load the task for job {}: {:?}", job.provider_job_id, err);
      return;
    }
  };

  let request = ImageGenerationRequest {
    model: job.ark_model_id.to_string(),
    prompt: job.prompt.clone(),
    image: job.reference_images.clone(),
    size: Some(job.size.clone()),
    sequential_image_generation: None,
    sequential_image_generation_options: None,
    layer_decomposition: false,
    output_format: None,
    background: None,
    response_format: ImageResponseFormat::Url,
    watermark: false,
  };

  info!("[BytePlusImage] Generating {} image(s) for task {}", job.image_count, task.id.as_str());

  let calls = (0..job.image_count).map(|_| generate_images(&job.api_key, &request));
  let outcome = collect_results(join_all(calls).await);

  if outcome.results.is_empty() {
    let (failure_type, message) = outcome.maybe_failure
      .unwrap_or((TaskFailureType::GenerationFailed, "BytePlus returned no images.".to_string()));
    handle_byteplus_failure(&app, &task, failure_type, &message).await;
    return;
  }

  if let Some((_, message)) = &outcome.maybe_failure {
    warn!("[BytePlusImage] Task {} got {} image(s); the rest failed: {}", task.id.as_str(), outcome.results.len(), message);
  }

  // NB: The error isn't `Send`; keep only its message across the next await.
  let maybe_error = handle_byteplus_complete(&app, &task, &outcome.results).await
    .err()
    .map(|err| err.to_string());

  if let Some(message) = maybe_error {
    error!("[BytePlusImage] Could not save the images for task {}: {}", task.id.as_str(), message);
    handle_byteplus_failure(&app, &task, TaskFailureType::GenerationFailed, &message).await;
  }
}

/// True while the Seedream job with this provider job id is running in this app session.
pub fn is_seedream_job_running(provider_job_id: &str) -> bool {
  running_jobs().contains(provider_job_id)
}

/// Lists a Seedream job as running from creation until it's dropped.
pub struct RunningSeedreamJob {
  provider_job_id: String,
}

impl RunningSeedreamJob {
  pub fn register(provider_job_id: &str) -> Self {
    running_jobs().insert(provider_job_id.to_string());
    Self { provider_job_id: provider_job_id.to_string() }
  }
}

impl Drop for RunningSeedreamJob {
  fn drop(&mut self) {
    running_jobs().remove(&self.provider_job_id);
  }
}

fn running_jobs() -> std::sync::MutexGuard<'static, HashSet<String>> {
  RUNNING_SEEDREAM_JOBS.lock().unwrap_or_else(|poisoned| poisoned.into_inner())
}

struct JobOutcome {
  results: Vec<ByteplusResult>,
  /// The first failure, kept to explain the job when nothing succeeded.
  maybe_failure: Option<(TaskFailureType, String)>,
}

fn collect_results(responses: Vec<Result<ImageGenerationResponse, ArkError>>) -> JobOutcome {
  let mut outcome = JobOutcome { results: Vec::new(), maybe_failure: None };

  for response in responses {
    match response {
      Ok(response) => {
        for image in response.data {
          if let Some(body) = image.error {
            let err = ArkError::Api(ArkApiError::from_error_body(&body));
            outcome.maybe_failure.get_or_insert((failure_type_for(&err), err.user_message()));
          } else if let Some(url) = image.url {
            outcome.results.push(ByteplusResult {
              url,
              extension: image.output_format.unwrap_or_else(|| "jpeg".to_string()),
              media_class: TaskMediaFileClass::Image,
            });
          }
        }
      }
      Err(err) => {
        warn!("[BytePlusImage] Seedream request failed: {:?}", err);
        outcome.maybe_failure.get_or_insert((failure_type_for(&err), err.user_message()));
      }
    }
  }

  outcome
}

#[cfg(test)]
mod tests {
  use super::*;

  #[test]
  fn a_job_counts_as_running_until_dropped() {
    let job = RunningSeedreamJob::register("seedream_test_job");
    assert!(is_seedream_job_running("seedream_test_job"));
    drop(job);
    assert!(!is_seedream_job_running("seedream_test_job"));
  }
}
