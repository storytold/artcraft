use std::time::Duration;

use log::{error, info, warn};
use mysql_queries::queries::generic_inference::gmicloud::list_pending_gmicloud_jobs::list_pending_gmicloud_jobs;
use gmicloud_client::requests::poll_request_queue::poll_request_queue::poll_gmicloud_request;

use crate::process_job::process_failed_job::process_failed_job;
use crate::process_job::process_successful_job::process_successful_job;
use crate::job_dependencies::JobDependencies;

pub async fn main_loop(job_dependencies: JobDependencies) {
  while !job_dependencies.application_shutdown.get() {
    let result = run_poll_iteration(&job_dependencies).await;

    let sleep_millis = match result {
      Ok(_) => job_dependencies.poll_interval_success_millis,
      Err(err) => {
        error!("Error in poll iteration: {:?}", err);
        let _ = job_dependencies.job_stats.increment_failure_count();
        job_dependencies.poll_interval_failure_millis
      }
    };

    tokio::time::sleep(Duration::from_millis(sleep_millis)).await;
  }

  warn!("GmiCloud job runner main loop is shut down.");
}

async fn run_poll_iteration(deps: &JobDependencies) -> anyhow::Result<()> {
  let pending_jobs = list_pending_gmicloud_jobs(&deps.mysql_pool).await?;

  if pending_jobs.is_empty() {
    return Ok(());
  }

  info!("Found {} pending GmiCloud job(s).", pending_jobs.len());

  for job in &pending_jobs {
    let poll_result = match poll_gmicloud_request(&deps.gmicloud_api_key, &job.request_id).await {
      Ok(response) => response,
      Err(err) => {
        warn!(
          "Error polling GmiCloud request {} for job {}: {:?}",
          job.request_id, job.job_token.as_str(), err
        );
        continue;
      }
    };

    if poll_result.is_failed() {
      let reason = "GmiCloud generation failed";
      info!(
        "Request {} failed. Processing job {} as failed.",
        job.request_id, job.job_token.as_str()
      );
      process_failed_job(deps, job, reason).await;
      continue;
    }

    if poll_result.is_in_progress() {
      continue;
    }

    if poll_result.is_success() {
      let video_url = match poll_result.video_url() {
        Some(url) => url.to_string(),
        None => {
          warn!(
            "Request {} succeeded but has no video_url for job {}. Skipping.",
            job.request_id, job.job_token.as_str()
          );
          continue;
        }
      };

      let thumbnail_url = poll_result.thumbnail_url().map(|s| s.to_string());

      info!(
        "Request {} completed, processing job {}.",
        job.request_id, job.job_token.as_str()
      );

      if let Err(err) = process_successful_job(deps, job, &video_url, thumbnail_url.as_deref()).await {
        warn!(
          "Error processing completed request {} for job {}: {:?}",
          job.request_id, job.job_token.as_str(), err
        );
        let _ = deps.job_stats.increment_failure_count();
      } else {
        let _ = deps.job_stats.increment_success_count();
      }
    }
  }

  Ok(())
}
