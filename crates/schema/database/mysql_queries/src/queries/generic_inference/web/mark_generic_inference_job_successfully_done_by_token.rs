use std::time::Duration;

use anyhow::anyhow;
use sqlx::{Executor, MySql, MySqlPool};

use enums::by_table::generic_inference_jobs::inference_result_type::InferenceResultType;
use errors::AnyhowResult;
use tokens::tokens::generic_inference_jobs::InferenceJobToken;
use crate::queries::generic_inference::job::list_available_generic_inference_jobs::AvailableInferenceJob;

/// Mark a job complete, acquiring a connection from the pool.
pub async fn mark_generic_inference_job_successfully_done_by_token(
  pool: &MySqlPool,
  token: &InferenceJobToken,
  maybe_entity_type: Option<InferenceResultType>,
  maybe_entity_token: Option<&str>,
  total_job_duration: Option<Duration>,
  inference_duration: Option<Duration>,
) -> AnyhowResult<()>
{
  mark_generic_inference_job_successfully_done_by_token_with_executor(
    pool,
    token,
    maybe_entity_type,
    maybe_entity_token,
    total_job_duration,
    inference_duration,
  ).await
}

/// Mark a job complete using an arbitrary executor. Pass `&mut *transaction`
/// to perform the write inside an existing transaction (e.g. right after a
/// `SELECT ... FOR UPDATE` re-check, to finalize exactly once).
pub async fn mark_generic_inference_job_successfully_done_by_token_with_executor<'e, E>(
  executor: E,
  token: &InferenceJobToken,
  maybe_entity_type: Option<InferenceResultType>,
  maybe_entity_token: Option<&str>,
  total_job_duration: Option<Duration>,
  inference_duration: Option<Duration>,
) -> AnyhowResult<()>
where
  E: Executor<'e, Database = MySql>,
{
  // NB: MySql's unsigned int (32 bits) can store integers up to 4,294,967,295.
  // Given milliseconds, this is ~49.71 days, which should be plenty for us.
  let truncated_total_job_execution_millis = total_job_duration
      .map(|duration| duration.as_millis() as u32)
      .unwrap_or(0);
  let truncated_inference_execution_millis = inference_duration
      .map(|duration| duration.as_millis() as u32)
      .unwrap_or(0);

  let query_result = sqlx::query!(
        r#"
UPDATE generic_inference_jobs
SET
  status = "complete_success",
  on_success_result_entity_type = ?,
  on_success_result_entity_token = ?,
  failure_reason = NULL,
  internal_debugging_failure_reason = NULL,
  success_execution_millis = ?,
  success_inference_execution_millis = ?,
  retry_at = NULL,
  successfully_completed_at = NOW()
WHERE token = ?
        "#,
        maybe_entity_type,
        maybe_entity_token,
        truncated_total_job_execution_millis,
        truncated_inference_execution_millis,
        token.as_str()
    )
      .execute(executor)
      .await;

  match query_result {
    Err(err) => Err(anyhow!("error with query: {:?}", err)),
    Ok(_r) => Ok(()),
  }
}
