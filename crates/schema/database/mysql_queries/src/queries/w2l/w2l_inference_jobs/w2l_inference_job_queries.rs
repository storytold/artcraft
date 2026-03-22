//! NB: This seems required for sqlx to generate the cached queries.
//! Sqlx's prepare needs a *single* binary to work against, so we need to
//! include these in the main binary to generate all the queries.

use std::path::Path;

use anyhow::anyhow;
use chrono::{DateTime, Utc};
use log::warn;
use sqlx::MySqlPool;

use enums_db::common::visibility::Visibility;
use errors::AnyhowResult;
use tokens::tokens::w2l_results::W2lResultToken;

// TODO(2022-08-04): These were moved into the 'mysql_queries' crate, but they need
//  to be split up into several modules for better maintainability. cf the already moved
//  `tts_inference_job` queries.

/// table: w2l_inference_jobs
#[derive(Debug)]
pub struct W2lInferenceJobRecord {
  pub id: i64,
  pub inference_job_token: String,
  pub uuid_idempotency_token: String,

  // ===== FACE TEMPLATE OPTIONS =====
  pub maybe_w2l_template_token: Option<String>,
  pub maybe_public_image_bucket_location: Option<String>,

  // ===== AUDIO SOURCE OPTIONS =====
  pub maybe_tts_inference_result_token: Option<String>,
  pub maybe_public_audio_bucket_hash: Option<String>,
  pub maybe_public_audio_bucket_location: Option<String>,

  pub maybe_original_audio_filename: Option<String>,
  pub maybe_original_audio_download_url: Option<String>,
  pub maybe_audio_mime_type: Option<String>,

  pub creator_ip_address: String,
  pub maybe_creator_user_token: Option<String>,

  pub creator_set_visibility: Visibility,
  pub disable_end_bump: i8, // bool
  pub disable_watermark: i8, // bool

  //pub maybe_subject_token: Option<String>,
  //pub maybe_actor_subject_token: Option<String>,
  pub status: String, // TODO
  pub attempt_count: i32,
  pub failure_reason: Option<String>,
  pub created_at: chrono::DateTime<Utc>,
  pub updated_at: chrono::DateTime<Utc>,
  pub retry_at: Option<chrono::DateTime<Utc>>,
}

pub async fn query_w2l_inference_job_records(pool: &MySqlPool, num_records: u32)
                                                   -> AnyhowResult<Vec<W2lInferenceJobRecord>>
{
  let job_records = sqlx::query_as!(
      W2lInferenceJobRecord,
        r#"
SELECT
  id,
  token AS inference_job_token,
  uuid_idempotency_token,

  maybe_w2l_template_token,
  maybe_public_image_bucket_location,
  maybe_tts_inference_result_token,
  maybe_public_audio_bucket_hash,
  maybe_public_audio_bucket_location,

  maybe_original_audio_filename,
  maybe_original_audio_download_url,
  maybe_audio_mime_type,

  creator_ip_address,
  maybe_creator_user_token,

  creator_set_visibility as `creator_set_visibility: enums_db::common::visibility::Visibility`,
  disable_end_bump,
  disable_watermark,

  status,
  attempt_count,
  failure_reason,
  created_at,
  updated_at,
  retry_at
FROM w2l_inference_jobs
WHERE
  (
    status IN ("pending", "attempt_failed")
  )
  AND
  (
    retry_at IS NULL
    OR
    retry_at < CURRENT_TIMESTAMP
  )
  LIMIT ?
        "#,
      num_records,
    )
    .fetch_all(pool)
    .await?;

  Ok(job_records)
}

pub struct W2lInferenceLockRecord {
  id: i64,
  status: String,
}

pub async fn grab_job_lock_and_mark_pending(
  pool: &MySqlPool,
  job: &W2lInferenceJobRecord
) -> AnyhowResult<bool> {

  // NB: We use transactions and "SELECT ... FOR UPDATE" to simulate mutexes.
  let mut transaction = pool.begin().await?;

  let maybe_record = sqlx::query_as!(
    W2lInferenceLockRecord,
        r#"
SELECT
  id,
  status
FROM w2l_inference_jobs
WHERE id = ?
FOR UPDATE
        "#,
        job.id,
    )
      .fetch_one(&mut *transaction)
      .await;

  let record : W2lInferenceLockRecord = match maybe_record {
    Ok(record) => record,
    Err(err) => {
      match err {
        sqlx::Error::RowNotFound => {
          return Err(anyhow!("could not job"));
        },
        _ => {
          return Err(anyhow!("query error"));
        }
      }
    }
  };

  let can_transact = match record.status.as_ref() {
    "pending" => true, // It's okay for us to take the lock.
    "attempt_failed" => true, // We can retry.
    "started" => false, // Job in progress (another job beat us, and we can't take the lock)
    "complete_success" => false, // Job already complete
    "complete_failure" => false, // Job already complete (permanently dead; no need to retry)
    "dead" => false, // Job already complete (permanently dead; retries exhausted)
    _ => false, // Future-proof
  };

  if !can_transact {
    transaction.rollback().await?;
    return Ok(false);
  }

  let _acquire_lock = sqlx::query!(
        r#"
UPDATE w2l_inference_jobs
SET
  status = 'started',
  attempt_count = attempt_count + 1,
  retry_at = NOW() + interval 2 minute
WHERE id = ?
        "#,
        job.id,
    )
      .execute(&mut *transaction)
      .await?;

  transaction.commit().await?;

  Ok(true)
}


pub async fn mark_w2l_inference_job_failure(
  pool: &MySqlPool,
  job: &W2lInferenceJobRecord,
  failure_reason: &str,
  max_attempts: i32
) -> AnyhowResult<()> {

  // statuses: "attempt_failed", "complete_failure", "dead"
  let mut next_status = "attempt_failed";

  if job.attempt_count >= max_attempts {
    // NB: Job attempt count is incremented at start
    next_status = "dead";
  }

  let _query_result = sqlx::query!(
        r#"
UPDATE w2l_inference_jobs
SET
  status = ?,
  failure_reason = ?,
  retry_at = NOW() + interval 2 minute
WHERE id = ?
        "#,
        next_status,
        failure_reason.to_string(),
        job.id,
    )
    .execute(pool)
    .await?;

  Ok(())
}

pub async fn mark_w2l_inference_job_done(
  pool: &MySqlPool,
  job: &W2lInferenceJobRecord,
  success: bool,
  maybe_result_token: Option<&str>
) -> AnyhowResult<()> {
  let status = if success { "complete_success" } else { "complete_failure" };

  let _query_result = sqlx::query!(
        r#"
UPDATE w2l_inference_jobs
SET
  status = ?,
  on_success_result_token = ?,
  failure_reason = NULL,
  retry_at = NULL
WHERE id = ?
        "#,
        status,
        maybe_result_token,
        job.id,
    )
    .execute(pool)
    .await?;

  Ok(())
}

pub struct SyntheticIdRecord {
  pub next_id: i64,
}

pub async fn insert_w2l_result<P: AsRef<Path>>(
  pool: &MySqlPool,
  job: &W2lInferenceJobRecord,
  bucket_video_results_path: P,
  file_size_bytes: u64,
  maybe_mime_type: Option<&str>,
  frame_width: u32,
  frame_height: u32,
  duration_millis: u64
) -> AnyhowResult<(u64, String)>
{
  let inference_result_token = W2lResultToken::generate().to_string();

  let bucket_video_result_path = &bucket_video_results_path
    .as_ref()
    .display()
    .to_string();

  let maybe_creator_user_token = job.maybe_creator_user_token.clone();
  let mut maybe_creator_synthetic_id : Option<u64> = None;

  let mut transaction = pool.begin().await?;

  if let Some(creator_user_token) = maybe_creator_user_token.as_deref() {
    let query_result = sqlx::query!(
        r#"
INSERT INTO w2l_result_synthetic_ids
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
  w2l_result_synthetic_ids
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
        //transaction.rollback().await?;
        return Err(anyhow!("Transaction failure: {:?}", err));
      }
    };

    let next_id = record.next_id as u64;
    maybe_creator_synthetic_id = Some(next_id);
  }

  let record_id = {
    let query_result = sqlx::query!(
        r#"
INSERT INTO w2l_results
SET
  token = ?,
  maybe_w2l_template_token = ?,
  maybe_creator_user_token = ?,
  creator_ip_address = ?,
  creator_set_visibility = ?,

  maybe_creator_synthetic_id = ?,

  public_bucket_video_path = ?,

  file_size_bytes = ?,
  mime_type = ?,
  frame_width = ?,
  frame_height = ?,
  duration_millis = ?
        "#,
      inference_result_token,
      job.maybe_w2l_template_token.clone(),
      job.maybe_creator_user_token.clone(),
      job.creator_ip_address.clone(),
      job.creator_set_visibility.to_str(),

      maybe_creator_synthetic_id,

      bucket_video_result_path,

      file_size_bytes,
      maybe_mime_type.unwrap_or(""),
      frame_width,
      frame_height,
      duration_millis
    )
        .execute(&mut *transaction)
        .await;

    let record_id = match query_result {
      Ok(res) => {
        res.last_insert_id()
      },
      Err(err) => {
        // TODO: handle better
        transaction.rollback().await?;
        return Err(anyhow!("Mysql error: {:?}", err));
      }
    };

    record_id
  };

  transaction.commit().await?;

  Ok((record_id, inference_result_token.clone()))
}

pub struct W2lTemplateRecord2 {
  pub template_token: String,
  pub template_type: String,
  pub creator_user_token: String,
  pub creator_username: String,
  pub private_bucket_hash: String,
  pub creator_display_name: String,
  pub title: String,
  pub frame_width: i32,
  pub frame_height: i32,
  pub duration_millis: i32,
  pub maybe_public_bucket_preview_image_object_name: Option<String>,
  pub maybe_public_bucket_preview_video_object_name: Option<String>,
  pub created_at: DateTime<Utc>,
  pub updated_at: DateTime<Utc>,
}

pub async fn get_w2l_template_by_token(pool: &MySqlPool, template_token: &str)
  -> AnyhowResult<Option<W2lTemplateRecord2>>
{

  // NB: Lookup failure is Err(RowNotFound).
  // NB: Since this is publicly exposed, we don't query sensitive data.
  let maybe_template = sqlx::query_as!(
      W2lTemplateRecord2,
        r#"
SELECT
    w2l.token as template_token,
    w2l.template_type,
    w2l.creator_user_token,
    users.username as creator_username,
    users.display_name as creator_display_name,
    w2l.title,
    w2l.frame_width,
    w2l.frame_height,
    w2l.duration_millis,
    w2l.private_bucket_hash,
    w2l.maybe_public_bucket_preview_image_object_name,
    w2l.maybe_public_bucket_preview_video_object_name,
    w2l.created_at,
    w2l.updated_at
FROM w2l_templates as w2l
JOIN users
ON users.token = w2l.creator_user_token
WHERE w2l.token = ?
AND w2l.user_deleted_at IS NULL
AND w2l.mod_deleted_at IS NULL
        "#,
      &template_token
    )
    .fetch_one(pool)
    .await; // TODO: This will return error if it doesn't exist

  match maybe_template {
    Ok(template) => Ok(Some(template)),
    Err(err) => {
      match err {
        sqlx::Error::RowNotFound => {
          Ok(None)
        },
        _ => {
          warn!("w2l template query error: {:?}", err);
          Err(anyhow!("Mysql error: {:?}", err))
        }
      }
    }
  }
}
