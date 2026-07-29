use std::fmt;
use std::sync::Arc;

use actix_web::error::ResponseError;
use actix_web::web::Json;
use actix_web::http::StatusCode;
use actix_web::web::Path;
use actix_web::{web, HttpMessage, HttpRequest, HttpResponse};
use chrono::{DateTime, Utc};
use log::warn;
use redis::Commands;

use http_server_common::response::serialize_as_json_error::serialize_as_json_error;
use mysql_queries::queries::generic_download::web::get_generic_download_job_status::get_generic_download_job_status;
use redis_common::redis_keys::RedisKeys;
use tokens::tokens::generic_download_jobs::DownloadJobToken;

use crate::state::server_state::ServerState;

/// For the URL PathInfo
#[derive(Deserialize)]
pub struct GetGenericDownloadJobStatusPathInfo {
  token: DownloadJobToken,
}

#[derive(Serialize)]
pub struct GetGenericDownloadJobStatusForResponse {
  pub job_token: DownloadJobToken,
  pub status: String,

  /// Extra, temporary status from Redis.
  /// This can denote inference progress, and the Python code can write to it.
  pub maybe_extra_status_description: Option<String>,

  pub attempt_count: u8,
  pub maybe_downloaded_entity_type: Option<String>,
  pub maybe_downloaded_entity_token: Option<String>,

  pub created_at: DateTime<Utc>,
  pub updated_at: DateTime<Utc>,
}

#[derive(Serialize)]
pub struct GetGenericDownloadJobStatusSuccessResponse {
  pub success: bool,
  pub state: GetGenericDownloadJobStatusForResponse,
}

#[derive(Debug, Serialize)]
pub enum GetGenericDownloadJobStatusError {
  NotFoundError,
  ServerError,
}

#[derive(Serialize)]
pub struct GetGenericDownloadJobStatusRecord {
  pub job_token: DownloadJobToken,

  pub status: String,
  pub attempt_count: i32,
  pub maybe_model_token: Option<String>,

  pub created_at: DateTime<Utc>,
  pub updated_at: DateTime<Utc>,
}

impl ResponseError for GetGenericDownloadJobStatusError {
  fn status_code(&self) -> StatusCode {
    match *self {
      GetGenericDownloadJobStatusError::NotFoundError => StatusCode::NOT_FOUND,
      GetGenericDownloadJobStatusError::ServerError=> StatusCode::INTERNAL_SERVER_ERROR,
    }
  }

  fn error_response(&self) -> HttpResponse {
    serialize_as_json_error(self)
  }
}

// NB: Not using derive_more::Display since Clion doesn't understand it.
impl fmt::Display for GetGenericDownloadJobStatusError {
  fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
    write!(f, "{:?}", self)
  }
}


pub async fn get_generic_download_job_status_handler(
  http_request: HttpRequest,
  path: Path<GetGenericDownloadJobStatusPathInfo>,
  server_state: web::Data<Arc<ServerState>>) -> Result<Json<GetGenericDownloadJobStatusSuccessResponse>, GetGenericDownloadJobStatusError>
{
  let maybe_job_status = get_generic_download_job_status(
    &path.token,
    &server_state.mysql_pool
  )
      .await
      .map_err(|err| {
        warn!("error querying job record: {:?}", err);
        GetGenericDownloadJobStatusError::ServerError
      })?;

  let job_status = match maybe_job_status {
    Some(record) => record,
    None => {
      warn!("job record not found");
      return Err(GetGenericDownloadJobStatusError::NotFoundError);
    }
  };

  let mut redis = server_state.redis_pool
      .get()
      .map_err(|e| {
        warn!("redis error: {:?}", e);
        GetGenericDownloadJobStatusError::ServerError
      })?;

  let extra_status_key = RedisKeys::generic_download_extra_status_info(path.token.as_str());
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

  let model_for_response = GetGenericDownloadJobStatusForResponse {
    job_token: job_status.job_token,
    status: job_status.status,
    maybe_extra_status_description,
    attempt_count: job_status.attempt_count as u8,
    maybe_downloaded_entity_token: job_status.maybe_downloaded_entity_token,
    maybe_downloaded_entity_type: job_status.maybe_downloaded_entity_type,
    created_at: job_status.created_at,
    updated_at: job_status.updated_at,
  };

  let response = GetGenericDownloadJobStatusSuccessResponse {
    success: true,
    state: model_for_response,
  };

  Ok(Json(response))
}
