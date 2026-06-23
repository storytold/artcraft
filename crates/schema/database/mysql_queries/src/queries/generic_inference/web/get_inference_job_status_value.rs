use sqlx::MySqlPool;

use enums::common::job_status_plus::JobStatusPlus;
use tokens::tokens::generic_inference_jobs::InferenceJobToken;

/// Lightweight lookup of just an inference job's `status` by token.
///
/// Unlike [`get_inference_job_status`](super::get_inference_job_status), this
/// avoids the large multi-table join — it reads a single column. Returns
/// `Ok(None)` when no row matches the token.
pub async fn get_inference_job_status_value(
  pool: &MySqlPool,
  job_token: &InferenceJobToken,
) -> Result<Option<JobStatusPlus>, sqlx::Error> {
  let maybe_row = sqlx::query!(
    r#"
SELECT status as `status: enums::common::job_status_plus::JobStatusPlus`
FROM generic_inference_jobs
WHERE token = ?
    "#,
    job_token.as_str(),
  )
    .fetch_optional(pool)
    .await?;

  Ok(maybe_row.map(|row| row.status))
}
