use std::sync::Arc;

use actix_web::error::ResponseError;
use actix_web::http::StatusCode;
use actix_web::web::Path;
use actix_web::{web, HttpMessage, HttpRequest, HttpResponse};
use chrono::{DateTime, Utc};
use derive_more::Display;
use log::{error, warn};
use redis::Commands;

use mysql_queries::queries::tts::tts_model_upload_jobs::get_tts_model_upload_job_status::get_tts_model_upload_job_status;
use redis_common::redis_keys::RedisKeys;

use crate::http_server::web_utils::response_error_helpers::to_simple_json_error;
use crate::http_server::common_responses::common_web_error::CommonWebError;
use crate::state::server_state::ServerState;

/// For the URL PathInfo
#[derive(Deserialize)]
pub struct GetTtsUploadModelStatusPathInfo {
  token: String,
}

#[derive(Serialize)]
pub struct TtsUploadModelJobStatusForResponse {
  pub job_token: String,

  /// Primary status from the database (a state machine).
  pub status: String,

  // TODO: Not yet used.
  /// Extra, temporary status from Redis.
  /// This can denote inference progress, and the Python code can write to it.
  pub maybe_extra_status_description: Option<String>,

  pub attempt_count: u8,
  pub maybe_model_token: Option<String>,

  pub created_at: DateTime<Utc>,
  pub updated_at: DateTime<Utc>,
}

#[derive(Serialize)]
pub struct GetTtsUploadModelStatusSuccessResponse {
  pub success: bool,
  pub state: TtsUploadModelJobStatusForResponse,
}
pub async fn get_tts_upload_model_job_status_handler(
  http_request: HttpRequest,
  path: Path<GetTtsUploadModelStatusPathInfo>,
  server_state: web::Data<Arc<ServerState>>) -> Result<HttpResponse, CommonWebError>
{
  // NB: Since this is publicly exposed, we don't query sensitive data.
  let record = get_tts_model_upload_job_status(&path.token, &server_state.mysql_pool)
      .await
      .map_err(|err| {
        error!("tts template query error: {:?}", err);
        CommonWebError::from_anyhow_error(err)
      })?
      .ok_or(
        // TODO: 404
        CommonWebError::server_error_with_message("uncaught server error")
      )?;

  let mut redis = server_state.redis_pool
      .get()
      .map_err(|e| {
        warn!("redis error: {:?}", e);
        CommonWebError::from_error(e)
      })?;

  let extra_status_key = RedisKeys::tts_download_extra_status_info(&path.token);
  let maybe_extra_status_description : Option<String> = match redis.get(&extra_status_key) {
    Ok(Some(status)) => {
      Some(status)
    },
    Ok(None) => None,
    Err(e) => {
      warn!("redis error: {:?}", e);
      None // Fail open
    },
  };

  let model_for_response = TtsUploadModelJobStatusForResponse {
    job_token: record.job_token.clone(),
    status: record.status.clone(),
    maybe_extra_status_description,
    attempt_count: record.attempt_count as u8,
    maybe_model_token: record.maybe_model_token.clone(),
    created_at: record.created_at,
    updated_at: record.updated_at,
  };

  let response = GetTtsUploadModelStatusSuccessResponse {
    success: true,
    state: model_for_response,
  };

  let body = serde_json::to_string(&response)
      .map_err(|e| CommonWebError::from_error(e))?;

  Ok(HttpResponse::Ok()
      .content_type("application/json")
      .body(body))
}
