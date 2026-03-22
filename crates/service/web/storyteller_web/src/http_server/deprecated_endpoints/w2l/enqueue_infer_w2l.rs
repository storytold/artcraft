// NB: Incrementally getting rid of build warnings...
#![forbid(unused_imports)]
#![forbid(unused_mut)]
#![forbid(unused_variables)]

use std::fmt;
use std::sync::Arc;

use actix_web::error::ResponseError;
use actix_web::http::StatusCode;
use actix_web::{web, HttpRequest, HttpResponse};
use log::{info, warn};
use redis::Commands;

use enums_db::common::visibility::Visibility;
use http_server_common::request::get_request_ip::get_request_ip;
use mysql_queries::queries::w2l::w2l_inference_jobs::insert_w2l_inference_job::{insert_w2l_inference_job, InsertW2lInferenceJobArgs};
use redis_common::redis_keys::RedisKeys;

use crate::http_server::web_utils::response_error_helpers::to_simple_json_error;
use crate::state::server_state::ServerState;

#[derive(Deserialize)]
pub struct InferW2lRequest {
  w2l_template_token: Option<String>,
  tts_inference_result_token: Option<String>,
  creator_set_visibility: Option<Visibility>,
}

#[derive(Serialize)]
pub struct InferW2lSuccessResponse {
  pub success: bool,
}

#[derive(Debug)]
pub enum InferW2lError {
  BadInput(String),
  NotAuthorized,
  ServerError,
  RateLimited,
}

impl ResponseError for InferW2lError {
  fn status_code(&self) -> StatusCode {
    match *self {
      InferW2lError::BadInput(_) => StatusCode::BAD_REQUEST,
      InferW2lError::ServerError => StatusCode::INTERNAL_SERVER_ERROR,
      InferW2lError::NotAuthorized => StatusCode::UNAUTHORIZED,
      InferW2lError::RateLimited => StatusCode::TOO_MANY_REQUESTS,
    }
  }

  fn error_response(&self) -> HttpResponse {
    let error_reason = match self {
      InferW2lError::BadInput(reason) => reason.to_string(),
      InferW2lError::ServerError => "server error".to_string(),
      InferW2lError::NotAuthorized => "not authorized".to_string(),
      InferW2lError::RateLimited => "rate limited".to_string(),
    };

    to_simple_json_error(&error_reason, self.status_code())
  }
}

// NB: Not using derive_more::Display since Clion doesn't understand it.
impl fmt::Display for InferW2lError {
  fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
    write!(f, "{:?}", self)
  }
}

pub async fn infer_w2l_handler(
  http_request: HttpRequest,
  request: web::Json<InferW2lRequest>,
  server_state: web::Data<Arc<ServerState>>) -> Result<HttpResponse, InferW2lError>
{

  if true {
    unimplemented!("this isn't finished");
  }

  let maybe_session = server_state
    .session_checker
    .maybe_get_session_light(&http_request, &server_state.mysql_pool)
    .await
    .map_err(|e| {
      warn!("Session checker error: {:?}", e);
      InferW2lError::ServerError
    })?;

  // TODO
  //if let Err(_err) = server_state.redis_rate_limiter.rate_limit_request(&http_request) {
  //  return Err(InferW2lError::RateLimited);
  //}

  let maybe_user_token : Option<String> = maybe_session
    .as_ref()
    .map(|user_session| user_session.user_token.to_string());

  info!("Enqueue infer w2l by user token: {:?}", maybe_user_token);

  let w2l_template_token = match &request.w2l_template_token {
    None => {
      // TODO: Allow image uploads.
      return Err(InferW2lError::BadInput("w2l token is required".to_string()));
    },
    Some(t) => {
      // TODO: CHECK DATABASE!
      t.to_string()
    },
  };

  let tts_inference_result_token = match &request.tts_inference_result_token {
    None => {
      // TODO: Allow audio uploads.
      return Err(InferW2lError::BadInput("tts token is required".to_string()));
    },
    Some(t) => {
      // TODO: CHECK DATABASE!
      t.to_string()
    },
  };

  let mut redis = server_state.redis_pool
      .get()
      .map_err(|e| {
        warn!("redis error: {:?}", e);
        InferW2lError::ServerError
      })?;

  let redis_count_key = RedisKeys::w2l_template_usage_count(&w2l_template_token);

  redis.incr::<_, _, ()>(&redis_count_key, 1)
      .map_err(|e| {
        warn!("redis error: {:?}", e);
        InferW2lError::ServerError
      })?;

  let ip_address = get_request_ip(&http_request);
  let creator_set_visibility = "public".to_string();

  if true {
    unimplemented!("this isn't finished");
  }

  // FIXME: NB: This is an old query that was somewhat modernized when moved.
  //  All the same, do not copy this example!

  insert_w2l_inference_job(InsertW2lInferenceJobArgs {
    w2l_template_token: &w2l_template_token,
    tts_inference_result_token: &tts_inference_result_token,
    maybe_user_token: maybe_user_token.as_deref(),
    ip_address: &ip_address,
    creator_set_visibility: &creator_set_visibility,
    mysql_pool: &server_state.mysql_pool,
  }).await
      .map_err(|_err| {
        InferW2lError::ServerError
      })?;

  //info!("new w2l inference job id: {}", record_id);

  let response = InferW2lSuccessResponse {
    success: true,
  };

  let body = serde_json::to_string(&response)
    .map_err(|_e| InferW2lError::ServerError)?;

  Ok(HttpResponse::Ok()
    .content_type("application/json")
    .body(body))
}
