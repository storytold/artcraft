use anyhow::anyhow;
use log::warn;
use sqlx;
use sqlx::MySqlPool;

use enums_db::by_table::voice_conversion_results::voice_conversion_media_token_type::VoiceConversionMediaTokenType;
use errors::AnyhowResult;
use tokens::tokens::voice_conversion_results::VoiceConversionResultToken;

use crate::queries::generic_inference::job::list_available_generic_inference_jobs::AvailableInferenceJob;

/// Used to give user-facing order to logged in user inference requests
pub struct SyntheticIdRecord {
  pub next_id: i64,
}

pub struct InsertArgs<'a> {
  pub pool: &'a MySqlPool,
  pub job: &'a AvailableInferenceJob,
  pub public_bucket_hash: &'a str,
  pub file_size_bytes: u64,
  pub duration_millis: u64,
  pub is_on_prem: bool,
  pub worker_hostname: &'a str,
  pub worker_cluster: &'a str,
  pub is_debug_worker: bool,
}

pub async fn insert_voice_conversion_result(
  args: InsertArgs<'_>
) -> AnyhowResult<(VoiceConversionResultToken, u64)>
{
  let result_token = VoiceConversionResultToken::generate();

  let mut maybe_creator_synthetic_id : Option<u64> = None;

  let mut transaction = args.pool.begin().await?;

  if let Some(creator_user_token) = args.job.maybe_creator_user_token.as_deref() {
    let query_result = sqlx::query!(
        r#"
INSERT INTO voice_conversion_result_synthetic_ids
SET
  user_token = ?,
  next_id = 1
ON DUPLICATE KEY UPDATE
  user_token = ?,
  next_id = next_id + 1
        "#,
      creator_user_token,
      creator_user_token
    )
        .execute(&mut *transaction)
        .await;

    match query_result {
      Ok(_) => {},
      Err(err) => {
        //transaction.rollback().await?;
        warn!("Transaction failure: {:?}", err);
      }
    }

    let query_result = sqlx::query_as!(
    SyntheticIdRecord,
        r#"
SELECT
  next_id
FROM
  voice_conversion_result_synthetic_ids
WHERE
  user_token = ?
LIMIT 1
        "#,
      creator_user_token,
    )
        .fetch_one(&mut *transaction)
        .await;

    let record : SyntheticIdRecord = match query_result {
      Ok(record) => record,
      Err(err) => {
        warn!("Transaction failure: {:?}", err);
        transaction.rollback().await?;
        return Err(anyhow!("Transaction failure: {:?}", err));
      }
    };

    let next_id = record.next_id as u64;
    maybe_creator_synthetic_id = Some(next_id);
  }

  let record_id = {
    let query_result = sqlx::query!(
        r#"
INSERT INTO voice_conversion_results
SET
  token = ?,

  model_token = ?,

  media_token = ?,
  media_token_type = ?,

  maybe_creator_user_token = ?,
  maybe_creator_synthetic_id = ?,

  creator_ip_address = ?,
  creator_set_visibility = ?,

  public_bucket_hash = ?,
  bucket_has_wav = true,

  file_size_bytes = ?,
  duration_millis = ?,

  is_generated_on_prem = ?,
  generated_by_worker = ?,
  generated_by_cluster = ?,
  is_debug_request = ?
        "#,
      result_token.as_str(),

      args.job.maybe_model_token,

      args.job.maybe_input_source_token,
      VoiceConversionMediaTokenType::MediaUpload.to_str(), //args.job.maybe_input_source_token_type,

      args.job.maybe_creator_user_token,
      maybe_creator_synthetic_id,

      args.job.creator_ip_address,
      args.job.creator_set_visibility.to_str(),

      args.public_bucket_hash,

      args.file_size_bytes,
      args.duration_millis,

      args.is_on_prem,
      args.worker_hostname,
      args.worker_cluster,
      args.is_debug_worker,
    )
        .execute(&mut *transaction)
        .await;

    let record_id = match query_result {
      Ok(res) => {
        res.last_insert_id()
      },
      Err(err) => {
        // TODO: handle better
        //transaction.rollback().await?;
        return Err(anyhow!("Mysql error: {:?}", err));
      }
    };

    record_id
  };

  transaction.commit().await?;

  Ok((result_token, record_id))
}
