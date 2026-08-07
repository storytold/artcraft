//! Mark a first-party Minimax H3 job as successfully completed, pointing at
//! the resulting media file. Mirrors the Fal webhook success write.

use sqlx::{Executor, MySql};
use std::convert::TryFrom;
use std::marker::PhantomData;

use enums::by_table::generic_inference_jobs::inference_result_type::InferenceResultType;
use enums::common::job_status_plus::JobStatusPlus;
use tokens::tokens::generic_inference_jobs::InferenceJobToken;
use tokens::tokens::media_files::MediaFileToken;

pub struct MarkFirstPartyMinimaxH3JobSucceededArgs<'e, 'c, E>
  where E: 'e + Executor<'c, Database = MySql>
{
  pub job_token: &'e InferenceJobToken,

  /// The media file created from the worker's uploaded video.
  pub media_file_token: &'e MediaFileToken,

  /// Total wall-clock runtime of the job, in milliseconds.
  pub maybe_execution_duration_millis: Option<u64>,

  /// Inference-only runtime of the job, in milliseconds.
  pub maybe_inference_duration_millis: Option<u64>,

  pub mysql_executor: E,

  pub phantom: PhantomData<&'c E>,
}

pub async fn mark_first_party_minimax_h3_job_succeeded<'e, 'c : 'e, E>(
  args: MarkFirstPartyMinimaxH3JobSucceededArgs<'e, 'c, E>
) -> Result<(), sqlx::Error>
  where E: 'e + Executor<'c, Database = MySql>
{
  sqlx::query!(
    r#"
UPDATE generic_inference_jobs
SET
  status = ?,
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
    JobStatusPlus::CompleteSuccess.to_str(),
    InferenceResultType::MediaFile.to_str(),
    args.media_file_token.as_str(),
    args.maybe_execution_duration_millis.and_then(|millis| u32::try_from(millis).ok()),
    args.maybe_inference_duration_millis.and_then(|millis| u32::try_from(millis).ok()),
    args.job_token.as_str(),
  )
    .execute(args.mysql_executor)
    .await?;

  Ok(())
}
