use crate::core::state::task_database::TaskDatabase;
use crate::core::utils::task_database_pending_statuses::TASK_DATABASE_PENDING_STATUSES;
use enums::common::generation_provider::GenerationProvider;
use log::{error, info, warn};
use sqlite_tasks::queries::list_non_artcraft_pending_tasks::{
  list_non_artcraft_pending_tasks, ListNonArtcraftPendingTasksArgs,
};
use sqlite_tasks::queries::task::Task;
use std::time::Duration;

const SLEEP_NO_THIRD_PARTY_JOBS_SEEN: Duration = Duration::from_secs(10);
const SLEEP_THIRD_PARTY_JOBS_SEEN: Duration = Duration::from_secs(2);
const SLEEP_BETWEEN_FAL_POLLS: Duration = Duration::from_secs(1);
const SLEEP_ON_ERROR: Duration = Duration::from_secs(30);

/// Main loop that polls for third-party (non-Artcraft) tasks and processes them.
///
/// This thread runs for the lifetime of the application. On error, it pauses
/// and gracefully continues.
pub async fn third_party_task_polling_thread(
  task_database: TaskDatabase,
) -> ! {
  let mut has_ever_seen_third_party_jobs = false;

  loop {
    let result = poll_iteration(
      &task_database,
      &mut has_ever_seen_third_party_jobs,
    ).await;

    if let Err(err) = result {
      error!("[ThirdPartyPolling] Error in polling loop: {:?}", err);
      tokio::time::sleep(SLEEP_ON_ERROR).await;
    }
  }
}

async fn poll_iteration(
  task_database: &TaskDatabase,
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

  // Partition tasks by provider.
  let fal_tasks: Vec<&Task> = tasks.iter()
    .filter(|t| t.provider == GenerationProvider::Fal)
    .collect();

  let non_fal_tasks: Vec<&Task> = tasks.iter()
    .filter(|t| t.provider != GenerationProvider::Fal)
    .collect();

  // Shed non-FAL jobs for now — we'll add handlers for other providers later.
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

  if fal_tasks.is_empty() {
    let sleep_duration = SLEEP_THIRD_PARTY_JOBS_SEEN;
    tokio::time::sleep(sleep_duration).await;
    return Ok(());
  }

  info!(
    "[ThirdPartyPolling] {} FAL job(s) ready to check",
    fal_tasks.len(),
  );

  for task in &fal_tasks {
    info!(
      "[ThirdPartyPolling]   task_id={}, provider_job_id={:?}, type={:?}, status_url={:?}",
      task.id.as_str(),
      task.provider_job_id,
      task.task_type,
      task.queue_status_url,
    );
  }

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
