use std::fmt;
use std::sync::Arc;

use actix_web::error::ResponseError;
use actix_web::http::StatusCode;
use actix_web::{web, HttpRequest, HttpResponse};
use log::{info, warn};

use config::bad_urls::is_bad_tts_model_download_url;
use enums::by_table::generic_download_jobs::generic_download_type::GenericDownloadType;
use enums::common::visibility::Visibility;
use http_server_common::request::get_request_ip::get_request_ip;
use http_server_common::response::serialize_as_json_error::serialize_as_json_error;
use mysql_queries::queries::generic_download::web::insert_generic_download_job::{insert_generic_download_job, InsertGenericDownloadJobArgs};

use crate::http_server::validations::validate_idempotency_token_format::validate_idempotency_token_format;
use crate::http_server::validations::validate_model_title::validate_model_title;
use crate::state::server_state::ServerState;

#[derive(Deserialize)]
pub struct EnqueueGenericDownloadRequest {
  idempotency_token: String,
  title: String,
  download_url: String,
  generic_download_type: GenericDownloadType,

  /// Not all upload types will have an associated visibility, so supplying this is optional.
  /// If an upload type supports it and it is not supplied, assume a reasonable default or user
  /// setting.
  creator_set_visibility: Option<Visibility>,
}

#[derive(Serialize)]
pub struct EnqueueGenericDownloadSuccessResponse {
  pub success: bool,
  /// This is how frontend clients can request the job execution status.
  pub job_token: String,
}

#[derive(Debug, Serialize)]
pub enum EnqueueGenericDownloadError {
  BadInput(String),
  MustBeLoggedIn,
  ServerError,
  RateLimited,
}

impl ResponseError for EnqueueGenericDownloadError {
  fn status_code(&self) -> StatusCode {
    match *self {
      EnqueueGenericDownloadError::BadInput(_) => StatusCode::BAD_REQUEST,
      EnqueueGenericDownloadError::MustBeLoggedIn => StatusCode::UNAUTHORIZED,
      EnqueueGenericDownloadError::ServerError => StatusCode::INTERNAL_SERVER_ERROR,
      EnqueueGenericDownloadError::RateLimited => StatusCode::TOO_MANY_REQUESTS,
    }
  }

  fn error_response(&self) -> HttpResponse {
    serialize_as_json_error(self)
  }
}

// NB: Not using derive_more::Display since Clion doesn't understand it.
impl fmt::Display for EnqueueGenericDownloadError {
  fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
    write!(f, "{:?}", self)
  }
}

pub async fn enqueue_generic_download_handler(
  http_request: HttpRequest,
  request: web::Json<EnqueueGenericDownloadRequest>,
  server_state: web::Data<Arc<ServerState>>) -> Result<web::Json<EnqueueGenericDownloadSuccessResponse>, EnqueueGenericDownloadError>
{
  if let Err(_err) = server_state.redis_rate_limiters.model_upload.rate_limit_request(&http_request).await {
    return Err(EnqueueGenericDownloadError::RateLimited);
  }

  let maybe_user_session = server_state
    .session_checker
    .maybe_get_user_session(&http_request, &server_state.mysql_pool)
    .await
    .map_err(|e| {
      warn!("Session checker error: {:?}", e);
      EnqueueGenericDownloadError::ServerError
    })?;

  let user_session = match maybe_user_session {
    Some(session) => session,
    None => {
      warn!("not logged in");
      return Err(EnqueueGenericDownloadError::MustBeLoggedIn);
    }
  };

  let ip_address = get_request_ip(&http_request);
  let uuid = request.idempotency_token.to_string();
  let title = request.title.trim().to_string();
  let download_url = request.download_url.trim().to_string();

  let creator_set_visibility = request.creator_set_visibility
      .unwrap_or(Visibility::Public);

  if let Err(reason) = validate_idempotency_token_format(&uuid) {
    return Err(EnqueueGenericDownloadError::BadInput(reason));
  }

  if let Err(reason) = validate_model_title(&title) {
    return Err(EnqueueGenericDownloadError::BadInput(reason));
  }

  match is_bad_tts_model_download_url(&download_url) {
    Ok(false) => {} // Ok case
    Ok(true) => {
      return Err(EnqueueGenericDownloadError::BadInput("Bad model download URL".to_string()));
    }
    Err(err) => {
      warn!("Error parsing url: {:?}", err);
      return Err(EnqueueGenericDownloadError::BadInput("Bad model download URL".to_string()));
    }
  }

  let (job_token, record_id) = insert_generic_download_job(InsertGenericDownloadJobArgs {
    uuid_idempotency_token: &uuid,
    download_type: request.generic_download_type,
    download_url: &download_url,
    title: &title,
    creator_user_token: user_session.user_token.as_str(),
    creator_ip_address: &ip_address,
    creator_set_visibility,
    mysql_pool: &server_state.mysql_pool,
  })
      .await
      .map_err(|err| {
        warn!("New generic download creation DB error: {:?}", err);
        EnqueueGenericDownloadError::ServerError
      })?;

  info!("new generic download job id: {}, token: {}", record_id, job_token);

  server_state.firehose_publisher.enqueue_generic_download(user_session.user_token.as_str(), job_token.as_str())
      .await
      .map_err(|e| {
        warn!("error publishing event: {:?}", e);
        EnqueueGenericDownloadError::ServerError
      })?;

  let response = EnqueueGenericDownloadSuccessResponse {
    success: true,
    job_token: job_token.to_string(),
  };

  Ok(web::Json(response))
}
