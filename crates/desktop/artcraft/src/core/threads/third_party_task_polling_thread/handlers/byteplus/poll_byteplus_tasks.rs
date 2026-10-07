use std::collections::HashMap;
use std::sync::{LazyLock, Mutex};
use std::time::{Duration, Instant};

use byteplus_ark_client::creds::ark_api_key::ArkApiKey;
use byteplus_ark_client::error::ark_api_error::ArkApiError;
use byteplus_ark_client::error::ark_error::ArkError;
use byteplus_ark_client::requests::videos::get_video_task::get_video_task;
use byteplus_ark_client::requests::videos::video_task_types::{VideoTask, VideoTaskStatus};
use enums::tauri::tasks::task_failure_type::TaskFailureType;
use enums::tauri::tasks::task_media_file_class::TaskMediaFileClass;
use enums::tauri::tasks::task_status::TaskStatus;
use enums::tauri::tasks::task_type::TaskType;
use log::{error, info, warn};
use sqlite_tasks::queries::task::Task;
use sqlite_tasks::queries::update_task_status::{update_task_status, UpdateTaskArgs};
use tauri::{AppHandle, Manager};

use crate::core::commands::generate::byteplus::byteplus_common::{failure_type_for, read_byteplus_api_key};
use crate::core::commands::generate::generate_image::providers::byteplus::byteplus_image_job::is_seedream_job_running;
use crate::core::providers::credentials::provider_credential_loading_cache::ProviderCredentialLoadingCache;
use crate::core::state::task_database::TaskDatabase;
use crate::core::threads::third_party_task_polling_thread::handlers::byteplus::handle_byteplus_complete::{
  handle_byteplus_complete, ByteplusResult,
};
use crate::core::threads::third_party_task_polling_thread::handlers::byteplus::handle_byteplus_failure::handle_byteplus_failure;

/// Seedance tasks take minutes; checking each one more often only spends ModelArk rate limit.
const MIN_TIME_BETWEEN_CHECKS: Duration = Duration::from_secs(10);

/// When each task was last checked, so the shared polling loop can run faster than this provider.
static LAST_CHECKED: LazyLock<Mutex<HashMap<String, Instant>>> = LazyLock::new(|| Mutex::new(HashMap::new()));

/// Checks pending BytePlus tasks: Seedance videos are polled on ModelArk; Seedream images run in
/// their own job, so only those whose job is gone (the app quit mid-generation) are closed out.
pub async fn poll_byteplus_tasks(app: &AppHandle, tasks: &[&Task]) {
  let maybe_api_key = match read_byteplus_api_key(&app.state::<ProviderCredentialLoadingCache>()) {
    Ok(maybe_key) => maybe_key,
    Err(err) => {
      error!("[BytePlusPolling] Could not read the BytePlus API key: {:?}", err);
      None
    }
  };

  for task in tasks {
    if task.task_type == TaskType::ImageGeneration {
      close_out_orphaned_image_task(app, task).await;
      continue;
    }

    if !is_due_for_check(task) {
      continue;
    }

    let Some(api_key) = maybe_api_key.as_ref() else {
      warn!("[BytePlusPolling] No BytePlus API key; can't check task {}", task.id.as_str());
      continue;
    };

    poll_single_task(app, api_key, task).await;
  }
}

async fn close_out_orphaned_image_task(app: &AppHandle, task: &Task) {
  let is_running = task.provider_job_id.as_deref().is_some_and(is_seedream_job_running);
  if !is_running {
    handle_byteplus_failure(
      app,
      task,
      TaskFailureType::GenerationFailed,
      "ArtCraft closed before the image was ready. Generate it again.",
    ).await;
  }
}

async fn poll_single_task(app: &AppHandle, api_key: &ArkApiKey, task: &Task) {
  let Some(provider_task_id) = task.provider_job_id.as_deref() else {
    handle_byteplus_failure(app, task, TaskFailureType::GenerationFailed, "BytePlus didn't return a task id.").await;
    return;
  };

  let video_task = match get_video_task(api_key, provider_task_id).await {
    Ok(video_task) => video_task,
    Err(err) => {
      // Transient (network, rate limit): try again on the next pass.
      warn!("[BytePlusPolling] Could not check task {}: {:?}", task.id.as_str(), err);
      return;
    }
  };

  match video_task.status {
    VideoTaskStatus::Queued | VideoTaskStatus::Running | VideoTaskStatus::Unknown => {
      mark_started(app, task).await;
    }
    VideoTaskStatus::Succeeded => {
      forget(task);
      complete_task(app, task, video_task).await;
    }
    VideoTaskStatus::Failed | VideoTaskStatus::Cancelled | VideoTaskStatus::Expired => {
      forget(task);
      let (failure_type, message) = describe_failure(&video_task);
      handle_byteplus_failure(app, task, failure_type, &message).await;
    }
  }
}

async fn complete_task(app: &AppHandle, task: &Task, video_task: VideoTask) {
  let maybe_result = video_task.content.and_then(|content| {
    let (url, extension, media_class) = match task.task_type {
      TaskType::ObjectGeneration => (content.file_url?, "glb", TaskMediaFileClass::Dimensional),
      _ => (content.video_url?, "mp4", TaskMediaFileClass::Video),
    };
    Some(ByteplusResult { url, extension: extension.to_string(), media_class })
  });

  let Some(result) = maybe_result else {
    handle_byteplus_failure(app, task, TaskFailureType::GenerationFailed, "BytePlus finished without a file.").await;
    return;
  };

  info!("[BytePlusPolling] Task {} succeeded; saving the result", task.id.as_str());

  // NB: The error isn't `Send`; keep only its message across the next await.
  let maybe_error = handle_byteplus_complete(app, task, &[result]).await
    .err()
    .map(|err| err.to_string());

  if let Some(message) = maybe_error {
    error!("[BytePlusPolling] Could not save the result of task {}: {}", task.id.as_str(), message);
    handle_byteplus_failure(app, task, TaskFailureType::GenerationFailed, &message).await;
  }
}

fn describe_failure(video_task: &VideoTask) -> (TaskFailureType, String) {
  match (&video_task.status, &video_task.error) {
    (_, Some(body)) => {
      let err = ArkError::Api(ArkApiError::from_error_body(body));
      (failure_type_for(&err), err.user_message())
    }
    (VideoTaskStatus::Expired, None) => (TaskFailureType::GenerationFailed, "BytePlus took too long and gave up. Try again.".to_string()),
    (VideoTaskStatus::Cancelled, None) => (TaskFailureType::GenerationFailed, "The task was cancelled on BytePlus.".to_string()),
    _ => (TaskFailureType::GenerationFailed, "BytePlus couldn't generate this video.".to_string()),
  }
}

async fn mark_started(app: &AppHandle, task: &Task) {
  if task.status != TaskStatus::Pending {
    return;
  }
  let result = update_task_status(UpdateTaskArgs {
    db: app.state::<TaskDatabase>().get_connection(),
    task_id: &task.id,
    status: TaskStatus::Started,
  }).await;
  if let Err(err) = result {
    warn!("[BytePlusPolling] Could not mark task {} as started: {:?}", task.id.as_str(), err);
  }
}

fn is_due_for_check(task: &Task) -> bool {
  let mut last_checked = LAST_CHECKED.lock().unwrap_or_else(|poisoned| poisoned.into_inner());
  let now = Instant::now();
  match last_checked.get(task.id.as_str()) {
    Some(at) if now.duration_since(*at) < MIN_TIME_BETWEEN_CHECKS => false,
    _ => {
      last_checked.insert(task.id.as_str().to_string(), now);
      true
    }
  }
}

fn forget(task: &Task) {
  LAST_CHECKED.lock().unwrap_or_else(|poisoned| poisoned.into_inner()).remove(task.id.as_str());
}
