use std::time::Duration;

use log::{error, info, warn};

use grok_api_client::api::requests::videos::video_status::video_status::{
  video_status, FailureReason, VideoOutputInfo, VideoStatus, VideoStatusArgs, VideoStatusRequest,
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

  let response = match poll_result {
    Ok(response) => response,
    Err(err) => {
      handle_video_status_error(deps, job, err).await;
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
      finalize_complete_response(deps, job, video).await;
    }
    VideoStatus::Failed { reason, code, error, .. } => {
      let reason_str = format_failed_reason(reason, code.as_deref(), error.as_deref());
      info!(
        "Grok request {} for job {} reported failed: {}.",
        job.request_id, job.job_token.as_str(), reason_str,
      );
      process_failed_job(deps, job, &reason_str).await;
      let _ = deps.job_stats.increment_failure_count();
    }
  }
}

fn format_failed_reason(
  reason: FailureReason,
  maybe_code: Option<&str>,
  maybe_error: Option<&str>,
) -> String {
  // `process_failed_job` scans this string for "moderation" / "moderated" /
  // "platform rules" / "content policy" to decide the user-facing failure
  // category, so make sure ContentModerated always lands on that wording.
  match reason {
    FailureReason::ContentModerated => {
      format!(
        "Grok video content moderated: {}",
        maybe_error.unwrap_or("no details"),
      )
    }
    FailureReason::Unknown => {
      let code_part = maybe_code.unwrap_or("unknown");
      let error_part = maybe_error.unwrap_or("no details");
      format!("Grok video failed ({}): {}", code_part, error_part)
    }
  }
}

async fn finalize_complete_response(
  deps: &JobDependencies,
  job: &PendingGrokApiJob,
  maybe_video: Option<VideoOutputInfo>,
) {
  let video_url = match maybe_video.as_ref().and_then(|v| v.url.clone()) {
    Some(url) => url,
    None => {
      warn!(
        "Grok request {} reported Complete with no video.url for job {}. Skipping.",
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
    GrokError::ApiSpecific(GrokSpecificApiError::NotFound) => {
      // Treat NotFound as terminal — xAI doesn't know about this request_id
      // anymore (expired retention or never existed). Note: a true
      // `status:"expired"` poll response comes back as `VideoStatus::Failed`,
      // not as an error, so this arm is only for 404 from the HTTP layer.
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
