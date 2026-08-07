//! Look up a first-party Minimax H3 job by token.
//!
//! Only returns rows whose `job_type` is one of the first-party Minimax H3
//! job types — the internal worker API must never read (or later mutate)
//! unrelated jobs, so an unknown or non-Minimax token yields `Ok(None)`.

use sqlx::{Executor, MySql};
use std::marker::PhantomData;

use enums::by_table::generic_inference_jobs::inference_job_type::InferenceJobType;
use enums::common::job_status_plus::JobStatusPlus;
use enums::common::platform_type::PlatformType;
use tokens::tokens::anonymous_visitor_tracking::AnonymousVisitorTrackingToken;
use tokens::tokens::generic_inference_jobs::InferenceJobToken;
use tokens::tokens::non_unique::debug_logs_event_token::DebugLogEventToken;
use tokens::tokens::prompts::PromptToken;
use tokens::tokens::users::UserToken;

pub struct GetFirstPartyMinimaxH3JobByTokenArgs<'e, 'c, E>
  where E: 'e + Executor<'c, Database = MySql>
{
  pub job_token: &'e InferenceJobToken,

  pub mysql_executor: E,

  pub phantom: PhantomData<&'c E>,
}

#[derive(Debug)]
pub struct FirstPartyMinimaxH3JobDetails {
  pub job_token: InferenceJobToken,

  pub status: JobStatusPlus,
  pub job_type: InferenceJobType,

  pub maybe_creator_user_token: Option<UserToken>,
  pub maybe_creator_anonymous_visitor_token: Option<AnonymousVisitorTrackingToken>,
  pub creator_ip_address: String,

  pub maybe_prompt_token: Option<PromptToken>,
  pub maybe_debug_log_event_token: Option<DebugLogEventToken>,

  pub maybe_platform_type: Option<PlatformType>,
}

pub async fn get_first_party_minimax_h3_job_by_token<'e, 'c : 'e, E>(
  args: GetFirstPartyMinimaxH3JobByTokenArgs<'e, 'c, E>
) -> Result<Option<FirstPartyMinimaxH3JobDetails>, sqlx::Error>
  where E: 'e + Executor<'c, Database = MySql>
{
  let maybe_row = sqlx::query!(
    r#"
SELECT
  token as `job_token: tokens::tokens::generic_inference_jobs::InferenceJobToken`,
  status as `status: enums::common::job_status_plus::JobStatusPlus`,
  job_type as `job_type: enums::by_table::generic_inference_jobs::inference_job_type::InferenceJobType`,
  maybe_creator_user_token as `maybe_creator_user_token: tokens::tokens::users::UserToken`,
  maybe_creator_anonymous_visitor_token as `maybe_creator_anonymous_visitor_token: tokens::tokens::anonymous_visitor_tracking::AnonymousVisitorTrackingToken`,
  creator_ip_address,
  maybe_prompt_token as `maybe_prompt_token: tokens::tokens::prompts::PromptToken`,
  maybe_debug_log_event_token as `maybe_debug_log_event_token: tokens::tokens::non_unique::debug_logs_event_token::DebugLogEventToken`,
  platform_type as `maybe_platform_type: enums::common::platform_type::PlatformType`
FROM generic_inference_jobs
WHERE token = ?
AND job_type IN ('artcraft_minimax_h3_turbo', 'artcraft_minimax_h3_ultra')
    "#,
    args.job_token.as_str(),
  )
    .fetch_optional(args.mysql_executor)
    .await?;

  let Some(row) = maybe_row else {
    return Ok(None);
  };

  let job_type = match row.job_type {
    Some(job_type) => job_type,
    // Unreachable given the WHERE clause, but don't panic on it.
    None => return Ok(None),
  };

  Ok(Some(FirstPartyMinimaxH3JobDetails {
    job_token: row.job_token,
    status: row.status,
    job_type,
    maybe_creator_user_token: row.maybe_creator_user_token,
    maybe_creator_anonymous_visitor_token: row.maybe_creator_anonymous_visitor_token,
    creator_ip_address: row.creator_ip_address,
    maybe_prompt_token: row.maybe_prompt_token,
    maybe_debug_log_event_token: row.maybe_debug_log_event_token,
    maybe_platform_type: row.maybe_platform_type,
  }))
}
