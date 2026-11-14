use crate::core::providers::credentials::provider_credential_loading_cache::ProviderCredentialLoadingCache;
use crate::core::state::app_env_configs::app_env_configs::AppEnvConfigs;
use crate::core::state::data_dir::app_data_root::AppDataRoot;
use crate::core::state::task_database::TaskDatabase;
use crate::core::threads::third_party_task_polling_thread::handlers::fal::poll_fal_tasks::poll_fal_tasks;
use crate::core::threads::third_party_task_polling_thread::handlers::poll_wavespeed_tasks::poll_wavespeed_tasks;
use crate::core::threads::third_party_task_polling_thread::handlers::handle_provider_complete::try_resume_saved_completion;
use crate::core::utils::task_database_pending_statuses::TASK_DATABASE_PENDING_STATUSES;
use crate::services::storyteller::state::storyteller_credential_manager::StorytellerCredentialManager;
use enums::common::generation_provider::GenerationProvider;
use log::{error, info, warn};
use sqlite_tasks::queries::list_non_artcraft_pending_tasks::{
  list_non_artcraft_pending_tasks, ListNonArtcraftPendingTasksArgs,
};
use sqlite_tasks::queries::task::Task;
use std::time::Duration;
use tauri::AppHandle;

const SLEEP_NO_THIRD_PARTY_JOBS_SEEN: Duration = Duration::from_secs(10);
const SLEEP_THIRD_PARTY_JOBS_SEEN: Duration = Duration::from_secs(2);
const SLEEP_BETWEEN_FAL_POLLS: Duration = Duration::from_secs(1);
const SLEEP_ON_ERROR: Duration = Duration::from_secs(30);

/// Continuously restore receipts, clean owned caches, and poll third-party work with bounded intervals.
pub async fn third_party_task_polling_thread(
  app_handle: AppHandle,
  app_env_configs: AppEnvConfigs,
  app_data_root: AppDataRoot,
  task_database: TaskDatabase,
  storyteller_creds_manager: StorytellerCredentialManager,
  credential_cache: ProviderCredentialLoadingCache,
) -> ! {
  let mut has_ever_seen_third_party_jobs = false;
  let mut last_cleanup = None;
  let mut last_restore = None;

  loop {
    if last_restore.is_none_or(|last: std::time::Instant| last.elapsed() >= Duration::from_secs(60)) {
      if let Err(error) = crate::core::utils::provider_submission::restore_submissions(&app_data_root, &task_database, &app_env_configs.storyteller_host.to_api_hostname_and_scheme()).await {
        warn!("Could not recover WaveSpeed submission receipts: {error}");
      }
      last_restore = Some(std::time::Instant::now());
    }
    if last_cleanup.is_none_or(|last: std::time::Instant| last.elapsed() >= Duration::from_secs(600)) {
      if let Err(error) = super::handlers::provider_cache_cleanup::cleanup_provider_cache(&app_data_root, &task_database).await {
        warn!("Could not clean abandoned provider cache: {error}");
      }
      last_cleanup = Some(std::time::Instant::now());
    }
    let result = poll_iteration(
      &app_handle,
      &app_env_configs,
      &app_data_root,
      &task_database,
      &storyteller_creds_manager,
      &credential_cache,
      &mut has_ever_seen_third_party_jobs,
    ).await;

    if let Err(err) = result {
      error!("[ThirdPartyPolling] Error in polling loop: {:?}", err);
      tokio::time::sleep(SLEEP_ON_ERROR).await;
    }
  }
}

/// Resume saved completions first, then dispatch remaining pending tasks to their provider pollers.
async fn poll_iteration(
  app_handle: &AppHandle,
  app_env_configs: &AppEnvConfigs,
  app_data_root: &AppDataRoot,
  task_database: &TaskDatabase,
  storyteller_creds_manager: &StorytellerCredentialManager,
  credential_cache: &ProviderCredentialLoadingCache,
  has_ever_seen_third_party_jobs: &mut bool,
) -> Result<(), PollError> {
  let task_list = list_non_artcraft_pending_tasks(ListNonArtcraftPendingTasksArgs {
    db: task_database.get_connection(),
    task_statuses: &TASK_DATABASE_PENDING_STATUSES,
  }).await?;

  let tasks = task_list.tasks;

  if tasks.is_empty() {
    let sleep_duration = if *has_ever_seen_third_party_jobs {
      SLEEP_THIRD_PARTY_JOBS_SEEN
    } else {
      SLEEP_NO_THIRD_PARTY_JOBS_SEEN
    };
    tokio::time::sleep(sleep_duration).await;
    return Ok(());
  }

  *has_ever_seen_third_party_jobs = true;

  let mut pending_tasks = Vec::new();
  for task in tasks {
    if matches!(task.provider, GenerationProvider::Fal | GenerationProvider::WaveSpeed) {
      match try_resume_saved_completion(app_handle, app_env_configs, app_data_root, task_database, storyteller_creds_manager, &task).await {
        Ok(true) => continue,
        Ok(false) => {},
        Err(error) => {
          error!("[ThirdPartyPolling] Could not resume saved task {}: {error}", task.id.as_str());
          continue;
        },
      }
    }
    pending_tasks.push(task);
  }
  let tasks = pending_tasks;

  let fal_tasks: Vec<&Task> = tasks.iter()
    .filter(|t| t.provider == GenerationProvider::Fal)
    .collect();

  let non_fal_tasks: Vec<&Task> = tasks.iter()
    .filter(|t| !matches!(t.provider, GenerationProvider::Fal | GenerationProvider::WaveSpeed))
    .collect();

  if !non_fal_tasks.is_empty() {
    for task in &non_fal_tasks {
      warn!(
        "[ThirdPartyPolling] Skipping non-FAL task: id={}, provider={:?}, type={:?}",
        task.id.as_str(),
        task.provider,
        task.task_type,
      );
    }
  }

  let wavespeed_tasks: Vec<&Task> = tasks.iter()
    .filter(|task| task.provider == GenerationProvider::WaveSpeed)
    .collect();

  poll_wavespeed_tasks(
    app_handle, app_env_configs, app_data_root, task_database,
    storyteller_creds_manager, credential_cache, &wavespeed_tasks,
  ).await;

  if fal_tasks.is_empty() {
    tokio::time::sleep(SLEEP_THIRD_PARTY_JOBS_SEEN).await;
    return Ok(());
  }

  info!("[ThirdPartyPolling] {} FAL job(s) ready to check", fal_tasks.len());

  poll_fal_tasks(
    app_handle,
    app_env_configs,
    app_data_root,
    task_database,
    storyteller_creds_manager,
    credential_cache,
    &fal_tasks,
  ).await;

  tokio::time::sleep(SLEEP_BETWEEN_FAL_POLLS).await;

  Ok(())
}

// ── Error ──

#[derive(Debug)]
enum PollError {
  SqliteTasksError(sqlite_tasks::error::SqliteTasksError),
}

impl From<sqlite_tasks::error::SqliteTasksError> for PollError {
  fn from(err: sqlite_tasks::error::SqliteTasksError) -> Self {
    Self::SqliteTasksError(err)
  }
}

impl std::fmt::Display for PollError {
  fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
    match self {
      Self::SqliteTasksError(err) => write!(f, "SQLite error: {:?}", err),
    }
  }
}
