use std::time::Duration;

use sqlx::{Executor, MySql};

use enums::by_table::generic_inference_jobs::inference_result_type::InferenceResultType;
use tokens::tokens::generic_inference_jobs::InferenceJobToken;

pub struct MarkGenericInferenceJobSuccessfullyDoneByTokenWithExecutorArgs<'a, E> {
  pub executor: E,
  pub token: &'a InferenceJobToken,
  pub maybe_entity_type: Option<InferenceResultType>,
  pub maybe_entity_token: Option<&'a str>,
  pub total_job_duration: Option<Duration>,
  pub inference_duration: Option<Duration>,
}

/// Mark a job complete using an arbitrary executor. Pass `&mut *transaction`
/// as the executor to perform the write inside an existing transaction (e.g.
/// right after a `SELECT ... FOR UPDATE` re-check, to finalize exactly once).
pub async fn mark_generic_inference_job_successfully_done_by_token_with_executor<'e, 'a, E>(
  args: MarkGenericInferenceJobSuccessfullyDoneByTokenWithExecutorArgs<'a, E>,
) -> Result<(), sqlx::Error>
where
  E: Executor<'e, Database = MySql>,
{
  // NB: MySql's unsigned int (32 bits) can store integers up to 4,294,967,295.
  // Given milliseconds, this is ~49.71 days, which should be plenty for us.
  let truncated_total_job_execution_millis = args.total_job_duration
      .map(|duration| duration.as_millis() as u32)
      .unwrap_or(0);
  let truncated_inference_execution_millis = args.inference_duration
      .map(|duration| duration.as_millis() as u32)
      .unwrap_or(0);

  sqlx::query!(
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
        args.maybe_entity_type,
        args.maybe_entity_token,
        truncated_total_job_execution_millis,
        truncated_inference_execution_millis,
        args.token.as_str(),
    )
      .execute(args.executor)
      .await?;

  Ok(())
}
