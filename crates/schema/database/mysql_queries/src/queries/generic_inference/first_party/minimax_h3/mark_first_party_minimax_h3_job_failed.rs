//! Permanently mark a first-party Minimax H3 job as failed.

use sqlx::{Executor, MySql};
use std::marker::PhantomData;

use enums::by_table::generic_inference_jobs::frontend_failure_category::FrontendFailureCategory;
use enums::common::job_status_plus::JobStatusPlus;
use tokens::tokens::generic_inference_jobs::InferenceJobToken;

/// `failure_reason` / `internal_debugging_failure_reason` are VARCHAR(512).
const MAX_FAILURE_REASON_CHARS: usize = 512;

pub struct MarkFirstPartyMinimaxH3JobFailedArgs<'e, 'c, E>
  where E: 'e + Executor<'c, Database = MySql>
{
  pub job_token: &'e InferenceJobToken,

  pub maybe_frontend_failure_category: Option<FrontendFailureCategory>,

  /// User-facing failure reason. Clamped to 512 characters.
  pub maybe_failure_reason: Option<&'e str>,

  /// Internal-only stack trace or error. Clamped to 512 characters.
  pub maybe_internal_debugging_failure_reason: Option<&'e str>,

  pub mysql_executor: E,

  pub phantom: PhantomData<&'c E>,
}

pub async fn mark_first_party_minimax_h3_job_failed<'e, 'c : 'e, E>(
  args: MarkFirstPartyMinimaxH3JobFailedArgs<'e, 'c, E>
) -> Result<(), sqlx::Error>
  where E: 'e + Executor<'c, Database = MySql>
{
  let maybe_failure_reason = args.maybe_failure_reason
    .map(|reason| clamp_chars(reason, MAX_FAILURE_REASON_CHARS));

  let maybe_internal_debugging_failure_reason = args.maybe_internal_debugging_failure_reason
    .map(|reason| clamp_chars(reason, MAX_FAILURE_REASON_CHARS));

  sqlx::query!(
    r#"
UPDATE generic_inference_jobs
SET
  status = ?,
  frontend_failure_category = ?,
  failure_reason = ?,
  internal_debugging_failure_reason = ?
WHERE token = ?
    "#,
    JobStatusPlus::CompleteFailure.to_str(),
    args.maybe_frontend_failure_category.map(|category| category.to_str()),
    maybe_failure_reason,
    maybe_internal_debugging_failure_reason,
    args.job_token.as_str(),
  )
    .execute(args.mysql_executor)
    .await?;

  Ok(())
}

fn clamp_chars(value: &str, max_chars: usize) -> &str {
  match value.char_indices().nth(max_chars) {
    Some((byte_index, _)) => &value[..byte_index],
    None => value,
  }
}
