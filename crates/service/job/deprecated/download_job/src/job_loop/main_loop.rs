use std::time::Duration;

use anyhow::anyhow;
use log::{error, warn};

use errors::AnyhowResult;
use jobs_common::noop_logger::NoOpLogger;
use mysql_queries::queries::generic_download::job::list_available_generic_download_jobs::{AvailableDownloadJob, list_available_generic_download_jobs};
use mysql_queries::queries::generic_download::job::mark_generic_download_job_failure::mark_generic_download_job_failure;

use crate::job_loop::process_single_job::process_single_job;
use crate::JobState;

// Job runner timeouts (guards MySQL)
const START_TIMEOUT_MILLIS : u64 = 500;
const INCREASE_TIMEOUT_MILLIS : u64 = 1000;

pub async fn main_loop(job_state: JobState) {
  let mut error_timeout_millis = START_TIMEOUT_MILLIS;

  let mut noop_logger = NoOpLogger::new(job_state.no_op_logger_millis as i64);

  loop {
    let gpu_is_missing = job_state.nvidia_smi_health_check_status.get_gpu_is_missing();
    if gpu_is_missing {
      error!("nvidia-smi health check failed; exiting program!");
      panic!("nvidia-smi health check failed; exiting program!");
    }

    let maybe_scoped_download_types = job_state.scoped_downloads.get_scoped_model_types();

    let num_records = 1;

    let maybe_available_jobs = list_available_generic_download_jobs(
      &job_state.mysql_pool,
      num_records,
      maybe_scoped_download_types).await;

    let jobs = match maybe_available_jobs {
      Ok(jobs) => jobs,
      Err(e) => {
        warn!("Error querying jobs: {:?}", e);
        std::thread::sleep(Duration::from_millis(error_timeout_millis));
        error_timeout_millis += INCREASE_TIMEOUT_MILLIS;
        continue;
      }
    };

    if jobs.is_empty() {
      noop_logger.log_after_awhile();

      std::thread::sleep(Duration::from_millis(job_state.job_batch_wait_millis));
      continue;
    }

    let result = process_jobs(&job_state, jobs).await;

    match result {
      Ok(_) => {},
      Err(e) => {
        warn!("Error processing jobs: {:?}", e);
        std::thread::sleep(Duration::from_millis(error_timeout_millis));
        error_timeout_millis += INCREASE_TIMEOUT_MILLIS;
        continue;
      }
    }

    error_timeout_millis = START_TIMEOUT_MILLIS; // reset

    std::thread::sleep(Duration::from_millis(job_state.job_batch_wait_millis));
  }
}

async fn process_jobs(job_state: &JobState, jobs: Vec<AvailableDownloadJob>) -> AnyhowResult<()> {
  for job in jobs.into_iter() {
    let gpu_is_missing = job_state.nvidia_smi_health_check_status.get_gpu_is_missing();
    if gpu_is_missing {
      return Err(anyhow!("nvidia-smi health check failed"));
    }

    let result = process_single_job(job_state, &job).await;
    match result {
      Ok(_) => {},
      Err(e) => {
        warn!("Failure to process job: {:?}", e);
        let failure_reason = "";
        let _r = mark_generic_download_job_failure(
          &job_state.mysql_pool,
          &job,
          failure_reason,
          job_state.job_max_attempts
        ).await;
      }
    }
  }

  Ok(())
}
