use anyhow::anyhow;
use sqlx::MySqlPool;

use enums_db::by_table::generic_inference_jobs::frontend_failure_category::FrontendFailureCategory;
use errors::AnyhowResult;

use crate::queries::generic_inference::job::list_available_generic_inference_jobs::AvailableInferenceJob;

pub async fn mark_generic_inference_job_completely_failed(
  pool: &MySqlPool,
  job: &AvailableInferenceJob,
  maybe_public_failure_reason: Option<&str>,
  maybe_internal_debugging_failure_reason: Option<&str>,
  maybe_frontend_failure_category: Option<FrontendFailureCategory>,
) -> AnyhowResult<()>
{
  let maybe_public_failure_reason
      = maybe_public_failure_reason.map(|reason| {
        let mut reason = reason.trim().to_string();
        reason.truncate(512); // Max length of column is 512
        reason
      });

  let maybe_internal_debugging_failure_reason
      = maybe_internal_debugging_failure_reason.map(|reason| {
        let mut reason = reason.trim().to_string();
        reason.truncate(512); // Max length of column is 512
        reason
      });

  let query_result = sqlx::query!(
        r#"
UPDATE generic_inference_jobs
SET
  status = "complete_failure",
  failure_reason = ?,
  internal_debugging_failure_reason = ?,
  frontend_failure_category = ?,
  retry_at = NULL
WHERE id = ?
        "#,
        maybe_public_failure_reason.as_deref(),
        maybe_internal_debugging_failure_reason.as_deref(),
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
