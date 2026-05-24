use log::{error, warn};

use enums::by_table::generic_inference_jobs::frontend_failure_category::FrontendFailureCategory;
use mysql_queries::queries::generic_inference::api_providers::grok_api::list_pending_grok_api_jobs::PendingGrokApiJob;
use mysql_queries::queries::generic_inference::job::mark_job_failed_by_token::{mark_job_failed_by_token, MarkJobFailedByTokenArgs};

use crate::job_dependencies::JobDependencies;

/// Mark the job failed in the database.
///
/// Unlike Seedance2Pro/Kinovi, Grok API video jobs are **non-refundable** —
/// xAI's video generation is billed regardless of outcome, so we never issue
/// a wallet refund here.
pub async fn process_failed_job(
  deps: &JobDependencies,
  job: &PendingGrokApiJob,
  reason: &str,
) {
  let reason_lower = reason.to_lowercase();

  let platform_rules_violation = reason_lower.contains("moderated")
    || reason_lower.contains("moderation")
    || reason_lower.contains("violates")
    || reason_lower.contains("platform rules")
    || reason_lower.contains("content policy");

  let frontend_failure_category = if platform_rules_violation {
    Some(FrontendFailureCategory::ModelRulesViolation)
  } else {
    Some(FrontendFailureCategory::GenerationFailed)
  };

  warn!(
    "Request for job {} failed: {}. Marking job failed.",
    job.job_token.as_str(), reason
  );

  let mark_failed_result = mark_job_failed_by_token(MarkJobFailedByTokenArgs {
    pool: &deps.mysql_pool,
    job_token: &job.job_token,
    maybe_public_failure_reason: Some(reason),
    internal_debugging_failure_reason: reason,
    maybe_frontend_failure_category: frontend_failure_category,
  }).await;

  if let Err(err) = mark_failed_result {
    error!(
      "Error marking job {} as failed: {:?}",
      job.job_token.as_str(), err
    );
  }
}
