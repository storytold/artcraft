use anyhow::anyhow;
use sqlx;
use sqlx::MySqlPool;

use enums_db::by_table::generic_inference_jobs::frontend_failure_category::FrontendFailureCategory;
use errors::AnyhowResult;

use crate::queries::generic_inference::job::list_available_generic_inference_jobs::AvailableInferenceJob;

/// Mark a single inference job failure. The job may be re-run.
pub async fn mark_generic_inference_job_failure(
  pool: &MySqlPool,
  job: &AvailableInferenceJob,
  maybe_public_failure_reason: Option<&str>,
  internal_debugging_failure_reason: &str,
  maybe_frontend_failure_category: Option<FrontendFailureCategory>,
  max_attempts: u16
) -> AnyhowResult<()> {

  // statuses: "attempt_failed", "complete_failure", "dead"
  let mut next_status = "attempt_failed";

  let maybe_public_failure_reason = maybe_public_failure_reason.map(|reason| {
    let mut reason = reason.trim().to_string();
    reason.truncate(512); // Max length of column is 512
    reason
  });

  // Max length of column is 512
  let mut internal_debugging_failure_reason = internal_debugging_failure_reason.trim().to_string();
  internal_debugging_failure_reason.truncate(512);

  if job.attempt_count >= max_attempts {
    // NB: Job attempt count is incremented at start
    next_status = "dead";
  }

  let query_result = sqlx::query!(
        r#"
UPDATE generic_inference_jobs
SET
  status = ?,
  failure_reason = ?,
  internal_debugging_failure_reason = ?,
  frontend_failure_category = ?,
  retry_at = NOW() + interval 2 minute
WHERE id = ?
        "#,
        next_status,
        maybe_public_failure_reason.as_deref(),
        &internal_debugging_failure_reason,
        maybe_frontend_failure_category,
        job.id.0,
    )
      .execute(pool)
      .await;

  match query_result {
    Err(err) => Err(anyhow!("error with query: {:?}", err)),
    Ok(_r) => Ok(()),
  }
}
