use std::time::Duration;

use log::{error, info, warn};

use grok_api_client::api::requests::videos::video_status::video_status::{
  video_status, VideoStatus, VideoStatusArgs, VideoStatusRequest,
};
use mysql_queries::queries::generic_inference::api_providers::grok_api::list_pending_grok_api_jobs::{
  list_pending_grok_api_jobs, PendingGrokApiJob,
};

use crate::job_dependencies::JobDependencies;
use crate::jobs::video_polling_job::process_job::process_failed_job::{
  process_failed_status, process_video_status_error,
};
use crate::jobs::video_polling_job::process_job::process_successful_job::process_complete_response;

pub async fn video_polling_main_loop(job_dependencies: JobDependencies) {
  while !job_dependencies.application_shutdown.get() {
    let result = run_poll_iteration(&job_dependencies).await;

    let sleep_millis = match result {
      Ok(_) => job_dependencies.poll_interval_success_millis,
      Err(err) => {
        error!("Error in Grok API poll iteration: {:?}", err);
        let _ = job_dependencies.job_stats.increment_failure_count();
        job_dependencies.poll_interval_failure_millis
      }
    };

    tokio::select! {
      _ = tokio::time::sleep(Duration::from_millis(sleep_millis)) => {}
      _ = job_dependencies.shutdown_notify.notified() => {}
    }
  }

  warn!("Grok API video polling main loop is shut down.");
}

async fn run_poll_iteration(deps: &JobDependencies) -> anyhow::Result<()> {
  let pending_jobs = list_pending_grok_api_jobs(&deps.mysql_pool).await?;

  if pending_jobs.is_empty() {
    return Ok(());
  }

  info!("Found {} pending Grok API job(s).", pending_jobs.len());

  for job in &pending_jobs {
    if deps.application_shutdown.get() {
      info!("Shutdown requested during Grok poll iteration. Stopping early.");
      break;
    }

    poll_one_job(deps, job).await;
  }

  Ok(())
}

async fn poll_one_job(deps: &JobDependencies, job: &PendingGrokApiJob) {
  let poll_result = video_status(VideoStatusArgs {
    api_key: &deps.grok_api_key,
    request: VideoStatusRequest {
      request_id: job.request_id.clone(),
    },
  }).await;

  let response = match poll_result {
    Ok(response) => response,
    Err(err) => {
      process_video_status_error(deps, job, err).await;
      return;
    }
  };

  match response.status {
    VideoStatus::Pending { progress } => {
      let progress_str = progress.map(|p| format!("{}%", p)).unwrap_or_else(|| "?".to_string());
      info!(
        "Grok request {} for job {} still pending ({} progress).",
        job.request_id, job.job_token.as_str(), progress_str,
      );
    }
    VideoStatus::Complete { video, .. } => {
      process_complete_response(deps, job, video).await;
    }
    VideoStatus::Failed { reason, code, error, .. } => {
      process_failed_status(deps, job, reason, code.as_deref(), error.as_deref()).await;
    }
  }
}
