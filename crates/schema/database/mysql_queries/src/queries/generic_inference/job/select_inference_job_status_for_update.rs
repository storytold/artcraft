use sqlx::{Executor, MySql};

use enums::common::job_status_plus::JobStatusPlus;
use tokens::tokens::generic_inference_jobs::InferenceJobToken;

/// `SELECT ... FOR UPDATE` the `status` of an inference job, locking the row
/// for the duration of the surrounding transaction.
///
/// Pass `&mut *transaction` as the executor. The row lock prevents a concurrent
/// finalizer (e.g. another poller, the web cancel path) from changing the
/// job's terminal state between this read and the caller's subsequent write,
/// so the caller can safely read-then-write the conclusion exactly once.
///
/// Returns `Ok(None)` when no row matches the token.
pub async fn select_inference_job_status_for_update<'e, E>(
  executor: E,
  job_token: &InferenceJobToken,
) -> Result<Option<JobStatusPlus>, sqlx::Error>
where
  E: Executor<'e, Database = MySql>,
{
  let maybe_row = sqlx::query!(
    r#"
SELECT status as `status: enums::common::job_status_plus::JobStatusPlus`
FROM generic_inference_jobs
WHERE token = ?
FOR UPDATE
    "#,
    job_token.as_str(),
  )
    .fetch_optional(executor)
    .await?;

  Ok(maybe_row.map(|row| row.status))
}
