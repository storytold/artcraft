use anyhow::anyhow;
use sqlx::MySqlPool;

use enums_db::by_table::generic_inference_jobs::frontend_failure_category::FrontendFailureCategory;
use enums_db::common::job_status_plus::JobStatusPlus;
use errors::AnyhowResult;
use tokens::tokens::generic_inference_jobs::InferenceJobToken;

pub struct MarkJobFailedByTokenArgs<'a> {
  pub pool: &'a MySqlPool,
  pub job_token: &'a InferenceJobToken,
  pub maybe_public_failure_reason: Option<&'a str>,
  pub internal_debugging_failure_reason: &'a str,
  pub maybe_frontend_failure_category: Option<FrontendFailureCategory>,
}

/// Permanently mark an inference job as failed, looked up by its token.
/// Unlike `mark_generic_inference_job_failure`, this does not allow retries —
/// the job will always land in `complete_failure`.
pub async fn mark_job_failed_by_token(args: MarkJobFailedByTokenArgs<'_>) -> AnyhowResult<()> {
  let maybe_public_failure_reason = args.maybe_public_failure_reason.map(|reason| {
    let mut reason = reason.trim().to_string();
    reason.truncate(512);
    reason
  });

  let mut internal_debugging_failure_reason = args.internal_debugging_failure_reason.trim().to_string();
  internal_debugging_failure_reason.truncate(512);

  const FAILURE_STATUS: &str = JobStatusPlus::CompleteFailure.to_str();

  let query_result = sqlx::query!(
    r#"
UPDATE generic_inference_jobs
SET
  status = ?,
  failure_reason = ?,
  internal_debugging_failure_reason = ?,
  frontend_failure_category = ?,
  retry_at = NULL
WHERE token = ?
    "#,
    FAILURE_STATUS,
    maybe_public_failure_reason.as_deref(),
    &internal_debugging_failure_reason,
    args.maybe_frontend_failure_category,
    args.job_token.as_str()
  )
    .execute(args.pool)
    .await;

  match query_result {
    Err(err) => Err(anyhow!("error with query: {:?}", err)),
    Ok(_r) => Ok(()),
  }
}
