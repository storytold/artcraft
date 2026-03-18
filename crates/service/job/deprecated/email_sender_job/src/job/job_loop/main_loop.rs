use std::time::Duration;

use log::{error, info, warn};

use errors::AnyhowResult;
use filesys::file_exists::file_exists;
use jobs_common::noop_logger::NoOpLogger;
use mysql_queries::queries::email_sender_jobs::list_available_email_sender_jobs::{AvailableEmailSenderJob, list_available_email_sender_jobs, ListAvailableEmailSenderJobArgs};
use mysql_queries::queries::email_sender_jobs::mark_email_sender_job_completely_failed::mark_email_sender_job_completely_failed;
use mysql_queries::queries::email_sender_jobs::mark_email_sender_job_failure::mark_email_sender_job_failure;

use crate::job::job_loop::process_single_job::process_single_job;
use crate::job::job_loop::process_single_job_error::ProcessSingleJobError;
use crate::job::job_loop::process_single_job_success_case::ProcessSingleJobSuccessCase;
use crate::job_dependencies::JobDependencies;

// Job runner timeouts (guards MySQL)
const START_TIMEOUT_MILLIS : u64 = 500;
const INCREASE_TIMEOUT_MILLIS : u64 = 1000;

/// Pause file millis
const PAUSE_FILE_EXISTS_WAIT_MILLIS : u64 = 1000 * 30;

pub async fn main_loop(job_dependencies: JobDependencies) {
  let mut noop_logger = NoOpLogger::new(job_dependencies.no_op_logger_millis as i64);

  let mut error_timeout_millis = START_TIMEOUT_MILLIS;
  let mut sort_by_priority = true;
  let mut sort_by_priority_count = 0;

  while !job_dependencies.application_shutdown.get() {
    if let Some(pause_file) = job_dependencies.fs.maybe_pause_file.as_deref() {
      while file_exists(pause_file) {
        warn!("Pause file exists. Pausing until deleted: {:?}", pause_file);
        std::thread::sleep(Duration::from_millis(PAUSE_FILE_EXISTS_WAIT_MILLIS));
      }
    }

    // Don't completely starve low-priority jobs
    if sort_by_priority_count >= job_dependencies.low_priority_starvation_prevention_every_nth {
      sort_by_priority_count = 0;
      sort_by_priority = false;
    }

    let maybe_available_jobs = list_available_email_sender_jobs(ListAvailableEmailSenderJobArgs {
      num_records: job_dependencies.job_batch_size,
      is_debug_worker: false, // TODO
      sort_by_priority,
      mysql_pool: &job_dependencies.mysql_pool,
    }).await;

    sort_by_priority = true;
    sort_by_priority_count += 1;

    let jobs = match maybe_available_jobs {
      Ok(jobs) => jobs,
      Err(e) => {
        error!("Error querying jobs: {:?}", e);
        std::thread::sleep(Duration::from_millis(error_timeout_millis));
        error_timeout_millis += INCREASE_TIMEOUT_MILLIS;
        continue;
      }
    };

    if jobs.is_empty() {
      noop_logger.log_message_after_awhile("No jobs picked up from database!");

      std::thread::sleep(Duration::from_millis(job_dependencies.job_batch_wait_millis));
      error_timeout_millis = START_TIMEOUT_MILLIS; // reset
      continue;
    }

    info!("Queried {} jobs from database", jobs.len());

    let batch_result = process_job_batch(&job_dependencies, jobs).await;

    match batch_result {
      Ok(_) => {},
      Err(e) => {
        error!("Error processing jobs: {:?}", e);
        std::thread::sleep(Duration::from_millis(error_timeout_millis));
        error_timeout_millis += INCREASE_TIMEOUT_MILLIS;
        continue;
      }
    }

    error_timeout_millis = START_TIMEOUT_MILLIS; // reset

    std::thread::sleep(Duration::from_millis(job_dependencies.job_batch_wait_millis));
  }

  warn!("Job runner main loop is shut down.");
}

// TODO: A common interface/trait for each submodule (tts, webvc) to declare how to determine if the job is "ready".
//  This probably returns a struct or enum with some measure of how many GB need to be downloaded.

async fn process_job_batch(job_dependencies: &JobDependencies, jobs: Vec<AvailableEmailSenderJob>) -> AnyhowResult<()> {
  for job in jobs.into_iter() {
    let result = process_single_job(job_dependencies, &job).await;
    match result {
      Ok(success_case) => {
        info!("Job loop iteration \"success\": {:?}", success_case);

        let increment_success_count = match success_case {
          ProcessSingleJobSuccessCase::JobCompleted => true,
          ProcessSingleJobSuccessCase::JobSkippedForRoutingTagMismatch => false,
          ProcessSingleJobSuccessCase::LockNotObtained => false,
        };

        if increment_success_count {
          let stats = job_dependencies.job_stats.increment_success_count().ok();
          warn!("Success stats: {:?}", stats);
        }
      },
      Err(err) => {
        warn!("Failure to process job: {:?}", err);
        let _r = handle_error(&job_dependencies, &job, err).await?;
      }
    }
  }

  Ok(())
}

#[derive(Eq,PartialEq)]
enum JobFailureClass {
  // Jobs that can be retried
  TransientFailure,
  // Jobs that cannot be retried and must be marked dead
  PermanentFailure,
}

#[derive(Eq,PartialEq)]
enum ContainerHealth {
  // No impact to container health
  Ignore,
  // Increment the container health failure counter
  IncrementContainerFailCount,
}

async fn handle_error(job_dependencies: &&JobDependencies, job: &AvailableEmailSenderJob, error: ProcessSingleJobError) -> AnyhowResult<()> {
  let (
    job_failure_class,
    container_health_report,
    internal_failure_reason,
  ) = match error {
    // Permanent failures
    ProcessSingleJobError::KeepAliveElapsed =>
      (
        JobFailureClass::PermanentFailure,
        ContainerHealth::Ignore,
        "keepalive elapsed".to_string(),
      ),
    ProcessSingleJobError::InvalidJob(ref err) =>
      (
        JobFailureClass::PermanentFailure,
        ContainerHealth::Ignore,
        format!("InvalidJob: {:?}", err),
      ),
    ProcessSingleJobError::NotYetImplemented =>
      (
        JobFailureClass::PermanentFailure,
        ContainerHealth::Ignore,
        "not yet implemented".to_string(),
      ),

    // Non-permanent failures
    ProcessSingleJobError::Other(ref err) =>
      (
        JobFailureClass::TransientFailure,
        ContainerHealth::IncrementContainerFailCount,
        format!("OtherErr: {:?}", err),
      ),
  };

  if container_health_report == ContainerHealth::IncrementContainerFailCount {
    // NB: We only increment the fail count for events that may indicate the job server is stuck.
    let stats = job_dependencies.job_stats.increment_failure_count().ok();
    warn!("Failure stats: {:?}", stats);
  }

  match job_failure_class {
    JobFailureClass::PermanentFailure => {
      let _r = mark_email_sender_job_completely_failed(
        &job_dependencies.mysql_pool,
        &job,
        Some(&internal_failure_reason),
      ).await;
    }
    JobFailureClass::TransientFailure => {
      let _r = mark_email_sender_job_failure(
        &job_dependencies.mysql_pool,
        &job,
        &internal_failure_reason,
        job_dependencies.job_max_attempts
      ).await;
    }
  }

  match error {
    // Post failure handling
    //   (none)
    // No-op
    ProcessSingleJobError::Other(_) => {}
    ProcessSingleJobError::InvalidJob(_) => {}
    ProcessSingleJobError::KeepAliveElapsed => {}
    ProcessSingleJobError::NotYetImplemented => {}
  }

  Ok(())
}
