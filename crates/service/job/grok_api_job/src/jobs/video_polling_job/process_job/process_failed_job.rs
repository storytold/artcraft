use log::{error, info, warn};

use enums::by_table::generic_inference_jobs::frontend_failure_category::FrontendFailureCategory;
use grok_api_client::api::requests::videos::video_status::video_status::FailureReason;
use grok_api_client::error::grok_error::GrokError;
use grok_api_client::error::grok_specific_api_error::GrokSpecificApiError;
use mysql_queries::queries::generic_inference::api_providers::grok_api::list_pending_grok_api_jobs::PendingGrokApiJob;
use mysql_queries::queries::generic_inference::job::mark_job_failed_by_token::{mark_job_failed_by_token, MarkJobFailedByTokenArgs};

use crate::job_dependencies::JobDependencies;

/// Handle a `VideoStatus::Failed` poll response: format the reason, derive
/// the user-facing failure category, mark the job failed in the database,
/// and increment the job-stats failure counter.
///
/// Grok API video jobs are **non-refundable** — xAI's video generation is
/// billed regardless of outcome, so we never issue a wallet refund here.
pub async fn process_failed_status(
  deps: &JobDependencies,
  job: &PendingGrokApiJob,
  reason: FailureReason,
  maybe_code: Option<&str>,
  maybe_error: Option<&str>,
) {
  let (reason_text, category) = describe_failed_status(reason, maybe_code, maybe_error);

  info!(
    "Grok request {} for job {} reported failed: {}.",
    job.request_id, job.job_token.as_str(), reason_text,
  );

  mark_job_failed_with_category(deps, job, &reason_text, category).await;
}

/// Handle a `GrokError` returned by the video-status poll. `NotFound` is
/// terminal (xAI no longer knows about this `request_id`); everything else
/// is treated as transient and just logged so the next poll retries.
///
/// Note: a true `status:"expired"` poll response comes back as
/// `VideoStatus::Failed` and is handled by [`process_failed_status`], not
/// here.
pub async fn process_video_status_error(
  deps: &JobDependencies,
  job: &PendingGrokApiJob,
  err: GrokError,
) {
  match &err {
    GrokError::ApiSpecific(GrokSpecificApiError::NotFound) => {
      let reason_text = "Grok video job not found (likely expired)";
      info!(
        "Grok request {} for job {} not found. Marking job failed.",
        job.request_id, job.job_token.as_str(),
      );
      mark_job_failed_with_category(
        deps,
        job,
        reason_text,
        FrontendFailureCategory::GenerationFailed,
      ).await;
    }
    _ => {
      warn!(
        "Transient error polling Grok request {} for job {}: {:?}",
        job.request_id, job.job_token.as_str(), err,
      );
    }
  }
}

fn describe_failed_status(
  reason: FailureReason,
  maybe_code: Option<&str>,
  maybe_error: Option<&str>,
) -> (String, FrontendFailureCategory) {
  match reason {
    FailureReason::ContentModerated => (
      format!(
        "Grok video content moderated: {}",
        maybe_error.unwrap_or("no details"),
      ),
      FrontendFailureCategory::ModelRulesViolation,
    ),
    FailureReason::Unknown => {
      let code_part = maybe_code.unwrap_or("unknown");
      let error_part = maybe_error.unwrap_or("no details");
      (
        format!("Grok video failed ({}): {}", code_part, error_part),
        FrontendFailureCategory::GenerationFailed,
      )
    }
  }
}

async fn mark_job_failed_with_category(
  deps: &JobDependencies,
  job: &PendingGrokApiJob,
  reason_text: &str,
  category: FrontendFailureCategory,
) {
  warn!(
    "Request for job {} failed: {}. Marking job failed.",
    job.job_token.as_str(), reason_text,
  );

  let mark_failed_result = mark_job_failed_by_token(MarkJobFailedByTokenArgs {
    pool: &deps.mysql_pool,
    job_token: &job.job_token,
    maybe_public_failure_reason: Some(reason_text),
    internal_debugging_failure_reason: reason_text,
    maybe_frontend_failure_category: Some(category),
  }).await;

  if let Err(err) = mark_failed_result {
    error!(
      "Error marking job {} as failed: {:?}",
      job.job_token.as_str(), err,
    );
  }

  let _ = deps.job_stats.increment_failure_count();
}
