use anyhow::anyhow;
use sqlx::{Executor, MySql};
use std::marker::PhantomData;

use enums::by_table::generic_inference_jobs::inference_result_type::InferenceResultType;
use enums::common::job_status_plus::JobStatusPlus;
use errors::AnyhowResult;
use tokens::tokens::batch_generations::BatchGenerationToken;
use tokens::tokens::generic_inference_jobs::InferenceJobToken;
use tokens::tokens::media_files::MediaFileToken;

pub struct MarkJobArgs<'e, 'c, E>
  where E: 'e + Executor<'c, Database = MySql>
{
  pub job_token: &'e InferenceJobToken,
  pub media_file_token: &'e MediaFileToken,
  pub maybe_batch_token: Option<&'e BatchGenerationToken>,
  pub mysql_executor: E,
  pub phantom: PhantomData<&'c E>,
}
pub async fn mark_fal_generic_inference_job_successfully_done<'e, 'c : 'e, E>(
  args: MarkJobArgs<'e, 'c, E>
) -> AnyhowResult<()>
  where E: 'e + Executor<'c, Database = MySql>
{
  const STATUS : JobStatusPlus = JobStatusPlus::CompleteSuccess;
  const RESULT_TYPE : InferenceResultType = InferenceResultType::MediaFile;

  let query_result = sqlx::query!(
        r#"
UPDATE generic_inference_jobs
SET
  status = ?,
  on_success_result_entity_type = ?,
  on_success_result_entity_token = ?,
  on_success_result_batch_token = ?,
  failure_reason = NULL,
  internal_debugging_failure_reason = NULL,
  success_execution_millis = NULL,
  success_inference_execution_millis = NULL,
  retry_at = NULL,
  successfully_completed_at = NOW()
WHERE token = ?
        "#,
        STATUS.to_str(),
        RESULT_TYPE.to_str(),
        args.media_file_token,
        args.maybe_batch_token.map(|t| t.as_str()),
        args.job_token,
    )
      .execute(args.mysql_executor)
      .await;

  match query_result {
    Err(err) => Err(anyhow!("error with query: {:?}", err)),
    Ok(_r) => Ok(()),
  }
}
