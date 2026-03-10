use std::time::Duration;

use log::{error, info, warn};

use crate::job_dependencies::JobDependencies;

pub async fn main_loop(job_dependencies: JobDependencies) {
  while !job_dependencies.application_shutdown.get() {
    let result = run_poll_iteration(&job_dependencies).await;

    if let Err(err) = result {
      error!("Error in poll iteration: {:?}", err);
      let _ = job_dependencies.job_stats.increment_failure_count();
    }

    tokio::time::sleep(Duration::from_millis(job_dependencies.poll_interval_millis)).await;
  }

  warn!("WorldLabs job runner main loop is shut down.");
}

async fn run_poll_iteration(_deps: &JobDependencies) -> anyhow::Result<()> {
  // TODO: Query pending WorldLabs jobs from DB, poll their status, and process results.
  info!("WorldLabs poll iteration (not yet implemented).");
  Ok(())
}
