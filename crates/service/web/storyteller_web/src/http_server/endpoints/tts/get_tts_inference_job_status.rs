use std::fmt;
use std::sync::Arc;

use actix_web::error::ResponseError;
use actix_web::http::StatusCode;
use actix_web::web::Path;
use actix_web::{web, HttpMessage, HttpRequest, HttpResponse};
use chrono::{DateTime, Utc};
use log::error;
use redis::{Commands, RedisResult};

use bucket_paths::legacy::typified_paths::public::media_files::bucket_file_path::MediaFileBucketPath;
use mysql_queries::queries::generic_inference::web::get_inference_job_status::get_inference_job_status;
use mysql_queries::queries::tts::tts_inference_jobs::get_tts_inference_job_status::get_tts_inference_job_status;
use redis_common::redis_keys::RedisKeys;
use tokens::tokens::generic_inference_jobs::InferenceJobToken;

use crate::http_server::web_utils::filter_model_name::filter_model_name;
use crate::http_server::common_responses::common_web_error::CommonWebError;
use crate::http_server::web_utils::response_error_helpers::to_simple_json_error;
use crate::state::server_state::ServerState;

/// For the URL PathInfo
#[derive(Deserialize)]
pub struct GetTtsInferenceStatusPathInfo {
  token: String,
}

#[derive(Serialize)]
pub struct TtsInferenceJobStatusForResponse {
  pub job_token: String,

  /// Primary status from the database (a state machine).
  pub status: String,

  /// Extra, temporary status from Redis.
  /// This can denote inference progress, and the Python code can write to it.
  pub maybe_extra_status_description: Option<String>,

  pub attempt_count: u8,

  pub maybe_result_token: Option<String>,
  pub maybe_public_bucket_wav_audio_path: Option<String>,

  pub model_token: String,
  pub tts_model_type: String,
  pub title: String, // Name of the TTS model

  pub raw_inference_text: String, // User text

  pub created_at: DateTime<Utc>,
  pub updated_at: DateTime<Utc>,
}

#[derive(Serialize)]
pub struct GetTtsInferenceStatusSuccessResponse {
  pub success: bool,
  pub state: TtsInferenceJobStatusForResponse,
}
// NB: Not using derive_more::Display since Clion doesn't understand it.
pub async fn get_tts_inference_job_status_handler(
  http_request: HttpRequest,
  path: Path<GetTtsInferenceStatusPathInfo>,
  server_state: web::Data<Arc<ServerState>>) -> Result<HttpResponse, CommonWebError>
{
  let job_token = path.into_inner().token;

  if job_token.trim() == "None" {
    // NB: A bunch of Python clients use our API and can fail in this manner.
    // This was a large traffic driver during the 2023-03-08 outage.
    return Err(CommonWebError::NotFound);
  }

  // NB(bt,2023-11-27): We're moving TT2 over to `inference-job` (from `tts-inference-job`), which
  // uses a wholly different job table. The token prefix determines the type of job:
  // Legacy TT2 jobs (tts_inference_jobs) start with "JTINF:", and generic jobs start with "jinf_".
  let record_for_response = if job_token.starts_with("jinf_") {
    modern_lookup(&job_token, &server_state).await?
  } else {
    legacy_lookup(&job_token, &server_state).await?
  };

  let response = GetTtsInferenceStatusSuccessResponse {
    success: true,
    state: record_for_response,
  };

  let body = serde_json::to_string(&response)
      .map_err(|e| {
        error!("error returning response: {:?}",  e);
        CommonWebError::from_error(e)
      })?;

  Ok(HttpResponse::Ok()
      .content_type("application/json")
      .body(body))
}

async fn legacy_lookup(job_token: &str, server_state: &ServerState)
  -> Result<TtsInferenceJobStatusForResponse, CommonWebError>
{
  // NB: Lookup failure is Err(RowNotFound).
  // NB: Since this is publicly exposed, we don't query sensitive data.
  let maybe_status =
      get_tts_inference_job_status(&job_token, &server_state.mysql_pool).await;

  let record = match maybe_status {
    Ok(Some(record)) => record,
    Ok(None) => return Err(CommonWebError::NotFound),
    Err(err) => {
      error!("tts job query error: {:?}", err);
      return Err(CommonWebError::from_anyhow_error(err));
    }
  };

  let mut redis = server_state.redis_pool
      .get()
      .map_err(|e| {
        error!("redis error: {:?}", e);
        CommonWebError::from_error(e)
      })?;

  // TODO(bt,2023-05-21): Make async.
  let extra_status_key = RedisKeys::tts_inference_extra_status_info(&job_token);
  let maybe_extra_status_description : Option<String> = match redis.get(&extra_status_key) {
    Ok(Some(status)) => {
      Some(status)
    },
    Ok(None) => None,
    Err(e) => {
      error!("redis error: {:?}", e);
      None // Fail open
    },
  };

  Ok(TtsInferenceJobStatusForResponse {
    job_token: record.job_token,
    status: record.status,
    maybe_extra_status_description,
    attempt_count: record.attempt_count as u8,
    maybe_result_token: record.maybe_result_token,
    maybe_public_bucket_wav_audio_path: record.maybe_public_bucket_wav_audio_path,
    model_token: record.model_token,
    tts_model_type: record.tts_model_type,
    title: record.title,
    raw_inference_text: record.raw_inference_text,
    created_at: record.created_at,
    updated_at: record.updated_at,
  })
}

async fn modern_lookup(job_token: &str, server_state: &ServerState)
  -> Result<TtsInferenceJobStatusForResponse, CommonWebError>
{
  // NB: Lookup failure is Err(RowNotFound).
  // NB: Since this is publicly exposed, we don't query sensitive data.
  let maybe_status =
      get_tts_inference_job_status(&job_token, &server_state.mysql_pool).await;

  let job_token = InferenceJobToken::new_from_str(job_token);

  let maybe_status = get_inference_job_status(&job_token, &server_state.mysql_pool).await;

  let record = match maybe_status {
    Ok(Some(record)) => record,
    Ok(None) => return Err(CommonWebError::NotFound),
    Err(err) => {
      error!("tts job query error: {:?}", err);
      return Err(CommonWebError::from_anyhow_error(err));
    }
  };

  let mut redis = server_state.redis_pool
      .get()
      .map_err(|e| {
        error!("redis error: {:?}", e);
        CommonWebError::from_error(e)
      })?;

  // TODO(bt,2023-05-21): Make async.
  let extra_status_key = RedisKeys::generic_inference_extra_status_info(job_token.as_str());
  let maybe_extra_status_value : RedisResult<Option<String>> = redis.get(&extra_status_key);

  let maybe_extra_status_description = match maybe_extra_status_value {
    Err(e) => {
      error!("redis error: {:?}", e);
      None // Fail open
    },
    Ok(maybe_value) => match maybe_value.as_deref() {
      Some("1") => {
        // TODO(bt,2023-10-20): Redis is reporting "1" and it's been surfacing this as a weird
        //  message to the frontend for months. This needs proper fixing.
        None
      },
      Some(value) => Some(value.to_string()),
      None => None,
    }
  };

  // NB: Model type is probably TT2, but let's filter it in case a hidden model type ever sneaks in
  let model_type = record.request_details.maybe_model_type.as_deref().unwrap_or_else(|| "tacotron2");
  let model_type = filter_model_name(model_type);

  Ok(TtsInferenceJobStatusForResponse {
    job_token: record.job_token.to_string(),
    status: record.status.to_string(),
    maybe_extra_status_description,
    attempt_count: record.attempt_count as u8,
    maybe_result_token: record.maybe_result_details.as_ref().map(|result| result.entity_token.clone()),
    maybe_public_bucket_wav_audio_path: record.maybe_result_details.map(|result_details| {
      match result_details.entity_type.as_str() {
        "media_file" => {
          // NB: We're migrating TTS to media_files.
          // Zero shot TTS uses media files.
          // Legacy TT2 uses old pathing.
          MediaFileBucketPath::from_object_hash(
            &result_details.public_bucket_location_or_hash,
            result_details.maybe_media_file_public_bucket_prefix.as_deref(),
            result_details.maybe_media_file_public_bucket_extension.as_deref())
              .get_full_object_path_str()
              .to_string()
        }
        _ => {
          // NB: TTS results receive the legacy treatment where their table only reports the full bucket path
          result_details.public_bucket_location_or_hash
        }
      }
    }),
    model_token: record.request_details.maybe_model_token.unwrap_or_else(|| "NO_MODEL_TOKEN".to_string()),
    tts_model_type: model_type,
    title: record.request_details.maybe_model_title.unwrap_or_else(|| "no model title".to_string()),
    raw_inference_text: record.request_details.maybe_raw_inference_text.unwrap_or_else(|| "no inference text".to_string()),
    created_at: record.created_at,
    updated_at: record.updated_at,
  })
}
