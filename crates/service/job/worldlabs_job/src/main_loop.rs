use std::time::Duration;

use log::{error, info, warn};
use mysql_queries::queries::generic_inference::worldlabs::list_pending_worldlabs_jobs::list_pending_worldlabs_jobs;
use worldlabs_api_client::api::api_types::operation_id::OperationId;
use worldlabs_api_client::api::requests::get_operation::get_operation::{get_operation, GetOperationArgs};

use crate::process_job::process_failed_job::process_failed_job;
use crate::process_job::process_successful_job::process_successful_job;
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

async fn run_poll_iteration(deps: &JobDependencies) -> anyhow::Result<()> {
  // 1. Query all non-terminal WorldLabs jobs from DB.
  let pending_jobs = list_pending_worldlabs_jobs(&deps.mysql_pool).await?;

  if pending_jobs.is_empty() {
    info!("No pending WorldLabs jobs.");
    return Ok(());
  }

  info!("Found {} pending WorldLabs job(s).", pending_jobs.len());

  // 2. For each pending job, poll its operation status from the World Labs API.
  for job in &pending_jobs {
    let operation_id = OperationId(job.operation_id.clone());

    let operation = match get_operation(GetOperationArgs {
      creds: &deps.worldlabs_creds,
      operation_id: &operation_id,
      request_timeout: Some(Duration::from_secs(30)),
    }).await {
      Ok(op) => op,
      Err(err) => {
        warn!(
          "Error polling WorldLabs operation {} for job {}: {:?}",
          job.operation_id, job.job_token.as_str(), err
        );
        continue;
      }
    };

    // 3. Check if the operation has an error.
    if let Some(ref op_error) = operation.error {
      let reason = op_error.message.as_deref().unwrap_or("unknown error");
      info!(
        "Operation {} failed: {}. Processing job {} as failed.",
        job.operation_id, reason, job.job_token.as_str()
      );
      process_failed_job(deps, job, reason).await;
      continue;
    }

    // 4. Check if the operation is done.
    if !operation.done {
      // Still in progress — check again next poll.
      info!(
        "Operation {} for job {} is still in progress.",
        job.operation_id, job.job_token.as_str()
      );
      continue;
    }

    // 5. Operation is done — process the result.
    info!(
      "Operation {} completed, processing job {}.",
      job.operation_id, job.job_token.as_str()
    );

    if let Err(err) = process_successful_job(deps, job, &operation).await {
      warn!(
        "Error processing completed operation {} for job {}: {:?}",
        job.operation_id, job.job_token.as_str(), err
      );
      let _ = deps.job_stats.increment_failure_count();
    } else {
      let _ = deps.job_stats.increment_success_count();
    }
  }

  Ok(())
}
