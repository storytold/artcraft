pub mod order_processing_main_loop;
pub mod process_one_order;
pub mod process_failed_job;
pub mod process_successful_image_job;
pub mod process_successful_job;

use enums::common::job_status_plus::JobStatusPlus;

/// Whether a job's status means it has already been fully settled and must not
/// be re-processed. Matches the terminal set excluded by the pending-jobs
/// lister (`complete_success` / `complete_failure`).
pub fn is_job_status_terminal(status: JobStatusPlus) -> bool {
  matches!(status, JobStatusPlus::CompleteSuccess | JobStatusPlus::CompleteFailure)
}
