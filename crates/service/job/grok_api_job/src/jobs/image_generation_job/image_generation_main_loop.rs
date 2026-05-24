use std::time::Duration;

use log::{info, warn};

use crate::job_dependencies::JobDependencies;

/// Stub loop for synchronous Grok image generation.
///
/// xAI's image endpoints (`/v1/images/generations`, `/v1/images/edits`) are
/// synchronous, so this loop will eventually pull queued requests off our side
/// instead of polling xAI for status. For now it ticks at the configured
/// interval and does nothing — the next iteration of this work will fill it in.
pub async fn image_generation_main_loop(job_dependencies: JobDependencies) {
  info!(
    "Grok image_generation_main_loop started (tick interval: {}ms). Stub — no work yet.",
    job_dependencies.image_generation_poll_interval_millis,
  );

  while !job_dependencies.application_shutdown.get() {
    tokio::select! {
      _ = tokio::time::sleep(Duration::from_millis(job_dependencies.image_generation_poll_interval_millis)) => {}
      _ = job_dependencies.shutdown_notify.notified() => {}
    }
  }

  warn!("Grok image generation main loop is shut down.");
}
