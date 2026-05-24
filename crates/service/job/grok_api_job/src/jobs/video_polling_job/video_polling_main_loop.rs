use std::time::Duration;

use log::{error, info, warn};

use grok_api_client::api::requests::videos::video_status::video_status::{
  video_status, VideoStatusArgs, VideoStatusRequest, VideoStatusState, VideoStatusSuccess,
};
use grok_api_client::error::grok_error::GrokError;
use grok_api_client::error::grok_specific_api_error::GrokSpecificApiError;
use mysql_queries::queries::generic_inference::api_providers::grok_api::list_pending_grok_api_jobs::{
  list_pending_grok_api_jobs, PendingGrokApiJob,
};

use crate::job_dependencies::JobDependencies;
use crate::jobs::video_polling_job::process_job::process_failed_job::process_failed_job;
use crate::jobs::video_polling_job::process_job::process_successful_job::process_successful_job;

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

  let success = match poll_result {
    Ok(success) => success,
    Err(err) => {
      handle_video_status_error(deps, job, err).await;
      return;
    }
  };

  match success.state {
    VideoStatusState::Pending => {
      let progress = success.progress.map(|p| format!("{}%", p)).unwrap_or_else(|| "?".to_string());
      info!(
        "Grok request {} for job {} still pending ({} progress).",
        job.request_id, job.job_token.as_str(), progress,
      );
    }
    VideoStatusState::Done => {
      finalize_done_response(deps, job, success).await;
    }
    VideoStatusState::Failed => {
      // The Failed variant is mapped into `GrokError::ApiSpecific(VideoJobFailed)`
      // by the client. We shouldn't hit this branch, but treat defensively.
      warn!(
        "Unexpected VideoStatusState::Failed surfaced as Ok for request {} (job {}).",
        job.request_id, job.job_token.as_str(),
      );
      process_failed_job(deps, job, "Grok video status reported failed").await;
      let _ = deps.job_stats.increment_failure_count();
    }
  }
}

async fn finalize_done_response(
  deps: &JobDependencies,
  job: &PendingGrokApiJob,
  success: VideoStatusSuccess,
) {
  let video_url = match success.video.as_ref().and_then(|v| v.url.clone()) {
    Some(url) => url,
    None => {
      warn!(
        "Grok request {} reported Done with no video.url for job {}. Skipping.",
        job.request_id, job.job_token.as_str(),
      );
      return;
    }
  };

  info!(
    "Grok request {} completed, processing job {}.",
    job.request_id, job.job_token.as_str(),
  );

  match process_successful_job(deps, job, &video_url).await {
    Ok(()) => {
      let _ = deps.job_stats.increment_success_count();
    }
    Err(err) => {
      warn!(
        "Error processing completed Grok request {} for job {}: {:?}",
        job.request_id, job.job_token.as_str(), err,
      );
      let _ = deps.job_stats.increment_failure_count();
    }
  }
}

async fn handle_video_status_error(
  deps: &JobDependencies,
  job: &PendingGrokApiJob,
  err: GrokError,
) {
  match &err {
    // Terminal: mark the job failed.
    GrokError::ApiSpecific(GrokSpecificApiError::VideoJobFailed { code, message }) => {
      let reason = format!("Grok video failed ({}): {}", code, message);
      info!(
        "Grok request {} for job {} reported failed. Marking job failed.",
        job.request_id, job.job_token.as_str(),
      );
      process_failed_job(deps, job, &reason).await;
      let _ = deps.job_stats.increment_failure_count();
    }
    GrokError::ApiSpecific(GrokSpecificApiError::VideoJobExpired) => {
      let reason = "Grok video job expired";
      info!(
        "Grok request {} for job {} expired. Marking job failed.",
        job.request_id, job.job_token.as_str(),
      );
      process_failed_job(deps, job, reason).await;
      let _ = deps.job_stats.increment_failure_count();
    }
    GrokError::ApiSpecific(GrokSpecificApiError::NotFound) => {
      // Treat NotFound as terminal — xAI doesn't know about this request_id
      // anymore (expired retention or never existed).
      let reason = "Grok video job not found (likely expired)";
      info!(
        "Grok request {} for job {} not found. Marking job failed.",
        job.request_id, job.job_token.as_str(),
      );
      process_failed_job(deps, job, reason).await;
      let _ = deps.job_stats.increment_failure_count();
    }
    // Transient: just log and let the next iteration retry.
    _ => {
      warn!(
        "Transient error polling Grok request {} for job {}: {:?}",
        job.request_id, job.job_token.as_str(), err,
      );
    }
  }
}
