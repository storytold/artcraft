use anyhow::anyhow;
use sqlx::pool::PoolConnection;
use sqlx::{MySql, MySqlPool};

use enums::by_table::generic_inference_jobs::frontend_failure_category::FrontendFailureCategory;
use enums::common::job_status_plus::JobStatusPlus;
use errors::AnyhowResult;
use tokens::tokens::generic_inference_jobs::InferenceJobToken;

pub struct MarkJobFailedByTokenArgs<'a> {
  pub pool: &'a MySqlPool,
  pub job_token: &'a InferenceJobToken,
  pub maybe_public_failure_reason: Option<&'a str>,
  pub internal_debugging_failure_reason: &'a str,
  pub maybe_frontend_failure_category: Option<FrontendFailureCategory>,
}

pub struct MarkJobFailedByTokenFromConnectionArgs<'a> {
  pub mysql_connection: &'a mut PoolConnection<MySql>,
  pub job_token: &'a InferenceJobToken,
  pub maybe_public_failure_reason: Option<&'a str>,
  pub internal_debugging_failure_reason: &'a str,
  pub maybe_frontend_failure_category: Option<FrontendFailureCategory>,
}

/// Permanently mark an inference job as failed, looked up by its token.
/// Uses a pool to acquire a connection.
pub async fn mark_job_failed_by_token(args: MarkJobFailedByTokenArgs<'_>) -> AnyhowResult<()> {
  execute_mark_failed(ExecuteMarkJobFailedByTokenArgs {
    executor: args.pool,
    job_token: args.job_token,
    maybe_public_failure_reason: args.maybe_public_failure_reason,
    internal_debugging_failure_reason: args.internal_debugging_failure_reason,
    maybe_frontend_failure_category: args.maybe_frontend_failure_category,
  }).await
}

/// Permanently mark an inference job as failed, looked up by its token.
/// Uses an existing connection.
pub async fn mark_job_failed_by_token_from_connection(args: MarkJobFailedByTokenFromConnectionArgs<'_>) -> AnyhowResult<()> {
  execute_mark_failed(ExecuteMarkJobFailedByTokenArgs {
    executor: &mut **args.mysql_connection,
    job_token: args.job_token,
    maybe_public_failure_reason: args.maybe_public_failure_reason,
    internal_debugging_failure_reason: args.internal_debugging_failure_reason,
    maybe_frontend_failure_category: args.maybe_frontend_failure_category,
  }).await
}

/// Permanently mark an inference job as failed using an arbitrary executor.
/// Pass `&mut *transaction` to write inside an existing transaction (e.g.
/// alongside a refund, after a `SELECT ... FOR UPDATE` re-check).
pub async fn mark_job_failed_by_token_with_executor<'e, E>(
  executor: E,
  job_token: &InferenceJobToken,
  maybe_public_failure_reason: Option<&str>,
  internal_debugging_failure_reason: &str,
  maybe_frontend_failure_category: Option<FrontendFailureCategory>,
) -> AnyhowResult<()>
where
  E: sqlx::Executor<'e, Database = MySql>,
{
  execute_mark_failed(ExecuteMarkJobFailedByTokenArgs {
    executor,
    job_token,
    maybe_public_failure_reason,
    internal_debugging_failure_reason,
    maybe_frontend_failure_category,
  }).await
}

struct ExecuteMarkJobFailedByTokenArgs<'a, E> {
  executor: E,
  job_token: &'a InferenceJobToken,
  maybe_public_failure_reason: Option<&'a str>,
  internal_debugging_failure_reason: &'a str,
  maybe_frontend_failure_category: Option<FrontendFailureCategory>,
}

async fn execute_mark_failed<'e, E>(
  args: ExecuteMarkJobFailedByTokenArgs<'_, E>,
) -> AnyhowResult<()>
where
  E: sqlx::Executor<'e, Database = MySql>,
{
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
    .execute(args.executor)
    .await;

  match query_result {
    Err(err) => Err(anyhow!("error with query: {:?}", err)),
    Ok(_r) => Ok(()),
  }
}
