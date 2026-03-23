// NB: Incrementally getting rid of build warnings...
#![forbid(unused_imports)]
#![forbid(unused_mut)]
#![forbid(unused_variables)]

use std::fmt;
use std::sync::Arc;

use actix_web::error::ResponseError;
use actix_web::http::StatusCode;
use actix_web::{web, HttpRequest, HttpResponse};
use log::warn;

use config::is_bad_video_download_url::is_bad_video_download_url;
use enums_db::common::visibility::Visibility;
use http_server_common::request::get_request_ip::get_request_ip;
use mysql_queries::queries::w2l::w2l_template_upload_jobs::insert_w2l_template_upload_job::{insert_w2l_template_upload_job, InsertW2lTemplateUploadJobArgs};
use user_input_common::check_for_slurs::contains_slurs;

use crate::http_server::validations::validate_model_title::validate_model_title;
use crate::http_server::web_utils::response_error_helpers::to_simple_json_error;
use crate::state::server_state::ServerState;

#[derive(Deserialize)]
pub enum W2lTemplateType {
  /// unknown
  Unknown,
  /// video
  Video,
  /// image
  Image,
}

#[derive(Deserialize)]
pub struct UploadW2lTemplateRequest {
  idempotency_token: String,
  title: String,
  download_url: String,
  template_type: Option<W2lTemplateType>,
  creator_set_visibility: Option<Visibility>,
}

#[derive(Serialize)]
pub struct UploadW2lTemplateSuccessResponse {
  pub success: bool,
  /// This is how frontend clients can request the job execution status.
  pub job_token: String,
}

#[derive(Debug)]
pub enum UploadW2lTemplateError {
  BadInput(String),
  MustBeLoggedIn,
  ServerError,
  RateLimited,
}

impl ResponseError for UploadW2lTemplateError {
  fn status_code(&self) -> StatusCode {
    match *self {
      UploadW2lTemplateError::BadInput(_) => StatusCode::BAD_REQUEST,
      UploadW2lTemplateError::MustBeLoggedIn => StatusCode::UNAUTHORIZED,
      UploadW2lTemplateError::ServerError => StatusCode::INTERNAL_SERVER_ERROR,
      UploadW2lTemplateError::RateLimited => StatusCode::TOO_MANY_REQUESTS,
    }
  }

  fn error_response(&self) -> HttpResponse {
    let error_reason = match self {
      UploadW2lTemplateError::BadInput(reason) => reason.to_string(),
      UploadW2lTemplateError::MustBeLoggedIn => "user must be logged in".to_string(),
      UploadW2lTemplateError::ServerError => "server error".to_string(),
      UploadW2lTemplateError::RateLimited => "rate limited".to_string(),
    };

    to_simple_json_error(&error_reason, self.status_code())
  }
}

// NB: Not using derive_more::Display since Clion doesn't understand it.
impl fmt::Display for UploadW2lTemplateError {
  fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
    write!(f, "{:?}", self)
  }
}

pub async fn upload_w2l_template_handler(
  http_request: HttpRequest,
  request: web::Json<UploadW2lTemplateRequest>,
  server_state: web::Data<Arc<ServerState>>) -> Result<HttpResponse, UploadW2lTemplateError>
{
  if let Err(_err) = server_state.redis_rate_limiters.model_upload.rate_limit_request(&http_request).await {
    return Err(UploadW2lTemplateError::RateLimited);
  }

  let maybe_user_session = server_state
    .session_checker
    .maybe_get_user_session(&http_request, &server_state.mysql_pool)
    .await
    .map_err(|e| {
      warn!("Session checker error: {:?}", e);
      UploadW2lTemplateError::ServerError
    })?;

  let user_session = match maybe_user_session {
    Some(session) => session,
    None => {
      warn!("not logged in");
      return Err(UploadW2lTemplateError::MustBeLoggedIn);
    }
  };

  if let Err(reason) = validate_idempotency_token(&request.idempotency_token) {
    return Err(UploadW2lTemplateError::BadInput(reason));
  }

  if let Err(reason) = validate_model_title(&request.title) {
    return Err(UploadW2lTemplateError::BadInput(reason));
  }

  if is_bad_video_download_url(&request.download_url).unwrap_or(true) {
    return Err(UploadW2lTemplateError::BadInput("url is invalid".to_string()));
  }

  if contains_slurs(&request.title) {
    return Err(UploadW2lTemplateError::BadInput("title contains slurs".to_string()));
  }

  let ip_address = get_request_ip(&http_request);

  let uuid = request.idempotency_token.to_string();
  let title = request.title.to_string();
  let download_url = request.download_url.to_string();

  let template_type = "unknown".to_string();
  let creator_set_visibility = "public".to_string();

  let job_token = insert_w2l_template_upload_job(InsertW2lTemplateUploadJobArgs {
    uuid: &uuid,
    creator_user_token: user_session.user_token.as_str(),
    creator_ip_address: &ip_address,
    creator_set_visibility: &creator_set_visibility,
    title: &title,
    template_type: &template_type,
    download_url: &download_url,
    mysql_pool: &server_state.mysql_pool,
  }).await
      .map_err(|err| {
        warn!("New w2l template upload creation DB error: {:?}", err);
        UploadW2lTemplateError::ServerError
      })?;

  server_state.firehose_publisher.enqueue_w2l_template_upload(user_session.user_token.as_str(), &job_token)
    .await
    .map_err(|e| {
      warn!("error publishing event: {:?}", e);
      UploadW2lTemplateError::ServerError
    })?;

  let response = UploadW2lTemplateSuccessResponse {
    success: true,
    job_token: job_token.to_string(),
  };

  let body = serde_json::to_string(&response)
    .map_err(|_e| UploadW2lTemplateError::ServerError)?;

  Ok(HttpResponse::Ok()
    .content_type("application/json")
    .body(body))
}

fn validate_idempotency_token(token: &str) -> Result<(), String> {
  if token.len() != 36 {
    return Err("idempotency token should be 36 characters".to_string());
  }

  Ok(())
}
