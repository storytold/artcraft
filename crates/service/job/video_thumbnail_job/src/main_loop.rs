use std::time::Duration;

use log::{error, info, warn};

use crate::job_dependencies::JobDependencies;

pub async fn main_loop(job_dependencies: JobDependencies) {
  while !job_dependencies.application_shutdown.get() {
    let result = run_iteration(&job_dependencies).await;

    if let Err(err) = result {
      error!("Error in video thumbnail iteration: {:?}", err);
      let _ = job_dependencies.job_stats.increment_failure_count();
    }

    tokio::time::sleep(Duration::from_millis(job_dependencies.poll_interval_millis)).await;
  }

  warn!("Video thumbnail job main loop is shut down.");
}

async fn run_iteration(_deps: &JobDependencies) -> anyhow::Result<()> {
  // TODO: Query for video media files without thumbnails, generate thumbnails,
  // upload to bucket, and update media file records.
  info!("Video thumbnail job iteration (not yet implemented).");
  Ok(())
}
