use std::time::Instant;

use anyhow::anyhow;
use log::{info, warn};

use enums::by_table::email_sender_jobs::email_category::EmailCategory;
use mysql_queries::queries::email_sender_jobs::list_available_email_sender_jobs::AvailableEmailSenderJob;
use mysql_queries::queries::email_sender_jobs::mark_email_sender_job_pending_and_grab_lock::mark_email_sender_job_pending_and_grab_lock;
use mysql_queries::queries::email_sender_jobs::mark_email_sender_job_successfully_done::mark_email_sender_job_successfully_done;

use crate::job::email_types::password_reset_email_sender::password_reset_email_sender;
use crate::job::job_loop::process_single_job_error::ProcessSingleJobError;
use crate::job::job_loop::process_single_job_success_case::ProcessSingleJobSuccessCase;
use crate::job_dependencies::JobDependencies;

pub async fn process_single_job(
  job_dependencies: &JobDependencies,
  job: &AvailableEmailSenderJob,
) -> Result<ProcessSingleJobSuccessCase, ProcessSingleJobError> {
  //let mut force_execution = false;

  // Some jobs have "routing tags". These ensure that jobs only execute on certain hosts.
  // This is typically for debugging or development.
  if let Some(routing_tag) = job.maybe_routing_tag.as_deref() {
    let routing_tag = routing_tag.to_lowercase();
    let hostname = job_dependencies.container.hostname.to_ascii_lowercase();

    if hostname.starts_with(&routing_tag) {
      info!("Job has routing tag ({}) for execution on this host ({})", routing_tag, hostname);
      //force_execution = true;
    } else {
      info!("Job routing tag ({}) doesn't match hostname ({}); skipping...", routing_tag, hostname);
      return Ok(ProcessSingleJobSuccessCase::JobSkippedForRoutingTagMismatch);
    }
  }

  // ==================== ATTEMPT TO GRAB JOB LOCK ==================== //

  let lock_acquired = mark_email_sender_job_pending_and_grab_lock(
    &job_dependencies.mysql_pool,
    job.id,
    &job_dependencies.container_db,
  ).await
      .map_err(|err| ProcessSingleJobError::Other(anyhow!("database error: {:?}", err)))?;

  if !lock_acquired {
    warn!("Could not acquire job lock for: {}", &job.id.0);
    return Ok(ProcessSingleJobSuccessCase::LockNotObtained)
  }

  process_single_job_wrap_with_logs(job_dependencies, job).await
}

async fn process_single_job_wrap_with_logs(
  job_dependencies: &JobDependencies,
  job: &AvailableEmailSenderJob,
) -> Result<ProcessSingleJobSuccessCase, ProcessSingleJobError> {

  println!("\n  ----------------------------------------- JOB START -----------------------------------------  \n");

  info!("Beginning work on job ({}): {:?}", job.id.0, job.token);

  let result = do_process_single_job(job_dependencies, job).await;

  println!("\n  ----------------------------------------- JOB END -----------------------------------------  \n");

  result
}

async fn do_process_single_job(
  job_dependencies: &JobDependencies,
  job: &AvailableEmailSenderJob,
) -> Result<ProcessSingleJobSuccessCase, ProcessSingleJobError> {

  let job_start_time = Instant::now();

  // ==================== HANDLE DIFFERENT INFERENCE TYPES ==================== //

  match job.email_category {
    EmailCategory::Welcome => {
      return Err(ProcessSingleJobError::NotYetImplemented);
    }
    EmailCategory::PasswordReset => {
      let _r = password_reset_email_sender(job, job_dependencies).await?;
    }
  };

  // =====================================================

  let job_duration = Instant::now().duration_since(job_start_time);

  info!("Job took duration to complete: {:?}", &job_duration);

  info!("Marking job complete...");

  mark_email_sender_job_successfully_done(
    &job_dependencies.mysql_pool,
    job,
  ).await
      .map_err(|err| ProcessSingleJobError::Other(anyhow!("database error: {:?}", err)))?;

  info!("Job done: {} : {:?}", job.id.0, job.token);

  Ok(ProcessSingleJobSuccessCase::JobCompleted)
}
