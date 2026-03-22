// NB: Incrementally getting rid of build warnings...
#![forbid(unused_imports)]
#![forbid(unused_mut)]
#![forbid(unused_variables)]

use chrono::{DateTime, Utc};
use sqlx::MySqlPool;

use enums_db::common::job_status::JobStatus;
use enums_db::common::visibility::Visibility;
use errors::AnyhowResult;

use crate::helpers::boolean_converters::i8_to_bool;
use crate::queries::tts::tts_inference_jobs::_keys::TtsInferenceJobId;

/// table: tts_inference_jobs
#[derive(Debug)]
pub struct AvailableTtsInferenceJob {
  pub id: TtsInferenceJobId,
  pub inference_job_token: String,
  pub uuid_idempotency_token: String,

  pub model_token: String,
  pub raw_inference_text: String,

  /// Zero is implied to be the default value (12 seconds)
  /// Negative is interpreted as "unlimited"
  /// NB: We can't technically control the seconds, but rather the model's "max_decoder_steps".
  /// We attempt to turn this into an appropriate "max_decoder_steps" value downstream of here.
  pub max_duration_seconds: i32,

  pub creator_ip_address: String,
  pub maybe_creator_user_token: Option<String>,
  pub creator_set_visibility: Visibility,

  pub is_from_api: bool,
  pub is_for_twitch: bool,
  pub is_debug_request: bool,

  pub status: JobStatus,
  pub priority_level: u8,
  pub attempt_count: i32,
  pub failure_reason: Option<String>,

  pub created_at: DateTime<Utc>,
  pub updated_at: DateTime<Utc>,
  pub retry_at: Option<DateTime<Utc>>,
}

/// Query jobs that are ready to run
/// If sorting by priority, be careful not to starve lower priority jobs
///  (ie. if there's an issue with higher priorities.)
pub async fn list_available_tts_inference_jobs(
  pool: &MySqlPool,
  sort_by_priority: bool,
  num_records: u32,
  is_debug_worker: bool
) -> AnyhowResult<Vec<AvailableTtsInferenceJob>> {

  // NB: This query is awkwardly written twice because this is the only way the
  // macro can statically type check the query, result types, and parameter bindings.
  //
  // The only difference here is the 'ORDER BY' clause !
  let job_records : Vec<AvailableTtsInferenceJobRawInternal> = if sort_by_priority {
    sqlx::query_as!(
      AvailableTtsInferenceJobRawInternal,
        r#"
SELECT
  id,
  token AS inference_job_token,
  uuid_idempotency_token,

  model_token,
  raw_inference_text,

  max_duration_seconds,

  creator_ip_address,
  maybe_creator_user_token,
  creator_set_visibility as `creator_set_visibility: enums_db::common::visibility::Visibility`,

  is_from_api,
  is_for_twitch,
  is_debug_request,

  status as `status: enums_db::common::job_status::JobStatus`,
  priority_level,
  attempt_count,
  failure_reason,

  created_at,
  updated_at,
  retry_at
FROM tts_inference_jobs
WHERE
  is_debug_request = ?
  AND
  (
    status IN ("pending", "attempt_failed")
  )
  AND
  (
    retry_at IS NULL
    OR
    retry_at < CURRENT_TIMESTAMP
  )
  ORDER BY priority_level DESC, id ASC
  LIMIT ?
        "#,
      is_debug_worker,
      num_records,
    ).fetch_all(pool).await?
  } else {
    sqlx::query_as!(
      AvailableTtsInferenceJobRawInternal,
        r#"
SELECT
  id,
  token AS inference_job_token,
  uuid_idempotency_token,

  model_token,
  raw_inference_text,

  max_duration_seconds,

  creator_ip_address,
  maybe_creator_user_token,
  creator_set_visibility as `creator_set_visibility: enums_db::common::visibility::Visibility`,

  is_from_api,
  is_for_twitch,
  is_debug_request,

  status as `status: enums_db::common::job_status::JobStatus`,
  priority_level,
  attempt_count,
  failure_reason,

  created_at,
  updated_at,
  retry_at
FROM tts_inference_jobs
WHERE
  is_debug_request = ?
  AND
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
      is_debug_worker,
      num_records,
    ).fetch_all(pool).await?
  };

  let job_records = job_records.into_iter()
      .map(|record : AvailableTtsInferenceJobRawInternal| {
        AvailableTtsInferenceJob {
          id: TtsInferenceJobId(record.id),
          inference_job_token: record.inference_job_token,
          uuid_idempotency_token: record.uuid_idempotency_token,
          model_token: record.model_token,
          raw_inference_text: record.raw_inference_text,
          max_duration_seconds: record.max_duration_seconds,
          creator_ip_address: record.creator_ip_address,
          maybe_creator_user_token: record.maybe_creator_user_token,
          creator_set_visibility: record.creator_set_visibility,
          is_from_api: i8_to_bool(record.is_from_api),
          is_for_twitch: i8_to_bool(record.is_for_twitch),
          is_debug_request: i8_to_bool(record.is_debug_request),
          status: record.status,
          priority_level: record.priority_level,
          attempt_count: record.attempt_count,
          failure_reason: record.failure_reason,
          created_at: record.created_at,
          updated_at: record.updated_at,
          retry_at: record.retry_at,
        }
      })
      .collect::<Vec<AvailableTtsInferenceJob>>();

  Ok(job_records)
}

/// Query jobs that are ready to run
/// Only find jobs with minimum priority
pub async fn list_available_tts_inference_jobs_with_minimum_priority(
  pool: &MySqlPool,
  minimum_priority: u8,
  num_records: u32,
  is_debug_worker: bool
) -> AnyhowResult<Vec<AvailableTtsInferenceJob>> {

  // NB: This query is awkwardly written twice because this is the only way the
  // macro can statically type check the query, result types, and parameter bindings.
  //
  // The only difference here is the 'ORDER BY' clause !
  let job_records : Vec<AvailableTtsInferenceJobRawInternal> =
    sqlx::query_as!(
      AvailableTtsInferenceJobRawInternal,
        r#"
SELECT
  id,
  token AS inference_job_token,
  uuid_idempotency_token,

  model_token,
  raw_inference_text,

  max_duration_seconds,
  
  creator_ip_address,
  maybe_creator_user_token,
  creator_set_visibility as `creator_set_visibility: enums_db::common::visibility::Visibility`,

  is_from_api,
  is_for_twitch,
  is_debug_request,

  status as `status: enums_db::common::job_status::JobStatus`,
  priority_level,
  attempt_count,
  failure_reason,

  created_at,
  updated_at,
  retry_at
FROM tts_inference_jobs
WHERE
  priority_level >= ?
  AND is_debug_request = ?
  AND
  (
    status IN ("pending", "attempt_failed")
  )
  AND
  (
    retry_at IS NULL
    OR
    retry_at < CURRENT_TIMESTAMP
  )
  ORDER BY priority_level DESC, id ASC
  LIMIT ?
        "#,
      minimum_priority,
      is_debug_worker,
      num_records,
    ).fetch_all(pool).await?;

  let job_records = job_records.into_iter()
      .map(|record : AvailableTtsInferenceJobRawInternal| {
        AvailableTtsInferenceJob {
          id: TtsInferenceJobId(record.id),
          inference_job_token: record.inference_job_token,
          uuid_idempotency_token: record.uuid_idempotency_token,
          model_token: record.model_token,
          raw_inference_text: record.raw_inference_text,
          max_duration_seconds: record.max_duration_seconds,
          creator_ip_address: record.creator_ip_address,
          maybe_creator_user_token: record.maybe_creator_user_token,
          creator_set_visibility: record.creator_set_visibility,
          is_from_api: i8_to_bool(record.is_from_api),
          is_for_twitch: i8_to_bool(record.is_for_twitch),
          is_debug_request: i8_to_bool(record.is_debug_request),
          status: record.status,
          priority_level: record.priority_level,
          attempt_count: record.attempt_count,
          failure_reason: record.failure_reason,
          created_at: record.created_at,
          updated_at: record.updated_at,
          retry_at: record.retry_at,
        }
      })
      .collect::<Vec<AvailableTtsInferenceJob>>();

  Ok(job_records)
}

#[derive(Debug)]
struct AvailableTtsInferenceJobRawInternal {
  pub id: i64,
  pub inference_job_token: String,
  pub uuid_idempotency_token: String,

  pub model_token: String,
  pub raw_inference_text: String,

  pub max_duration_seconds: i32,

  pub creator_ip_address: String,
  pub maybe_creator_user_token: Option<String>,
  pub creator_set_visibility: Visibility,

  pub is_from_api: i8,
  pub is_for_twitch: i8,
  pub is_debug_request: i8,

  pub status: JobStatus,
  pub priority_level: u8,
  pub attempt_count: i32,
  pub failure_reason: Option<String>,

  pub created_at: chrono::DateTime<Utc>,
  pub updated_at: chrono::DateTime<Utc>,
  pub retry_at: Option<chrono::DateTime<Utc>>,
}

