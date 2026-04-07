// NB: Incrementally getting rid of build warnings...
#![forbid(unused_imports)]
#![forbid(unused_mut)]
#![forbid(unused_variables)]

use std::fmt;

use actix_artcraft::sessions::user_sessions::http_user_session_manager::HttpUserSessionManager;
use actix_web::error::ResponseError;
use actix_web::http::StatusCode;
use actix_web::{web, HttpRequest, HttpResponse};
use http_server_common::response::response_error_helpers::to_simple_json_error;
use log::warn;
use mysql_queries::queries::users::user_sessions::delete_user_session::delete_user_session;
use sqlx::MySqlPool;
use user_traits_component::traits::internal_session_cache_purge::InternalSessionCachePurge;
use utoipa::ToSchema;

#[derive(Serialize, ToSchema)]
pub struct LogoutSuccessResponse {
  pub success: bool,
}

#[derive(Debug, ToSchema)]
pub enum LogoutError {
  ServerError,
}

impl ResponseError for LogoutError {
  fn status_code(&self) -> StatusCode {
    match *self {
      LogoutError::ServerError=> StatusCode::INTERNAL_SERVER_ERROR,
    }
  }

  fn error_response(&self) -> HttpResponse {
    let error_reason = match self {
      LogoutError::ServerError => "server error".to_string(),
    };

    to_simple_json_error(&error_reason, self.status_code())
  }
}

// NB: Not using derive_more::Display since Clion doesn't understand it.
impl fmt::Display for LogoutError {
  fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
    write!(f, "{:?}", self)
  }
}

#[utoipa::path(
  post,
  tag = "Users",
  path = "/v1/logout",
  responses(
    (status = 200, description = "Found", body = LogoutSuccessResponse),
    (status = 500, description = "Server error", body = LogoutError),
  ),
)]
pub async fn logout_handler(
  http_request: HttpRequest,
  session_cookie_manager: web::Data<HttpUserSessionManager>,
  mysql_pool: web::Data<MySqlPool>,
  internal_session_cache_purge: web::Data<dyn InternalSessionCachePurge>,
) -> Result<HttpResponse, LogoutError>
{
  // Best effort to delete Redis session cache
  internal_session_cache_purge.best_effort_purge_session_cache(&http_request);

  let maybe_session = session_cookie_manager
      .decode_session_payload_from_request(&http_request)
      .map_err(|e| {
        warn!("Session cookie decode error: {:?}", e);
        LogoutError::ServerError
      })?;

  if let Some(session) = maybe_session {
    let _r = delete_user_session(&session.session_token, &mysql_pool).await;
  }

  let mut delete_cookie = match http_request.cookie("session") {
    Some(cookie) => {
      cookie // delete this cookie
    },
    None => {
      session_cookie_manager.delete_cookie()
    }
  };

  let response = LogoutSuccessResponse {
    success: true,
  };

  let body = serde_json::to_string(&response)
    .map_err(|_e| LogoutError::ServerError)?;

  // Mark cookie for deletion
  delete_cookie.make_removal();

  Ok(HttpResponse::Ok()
    .cookie(delete_cookie)
    .content_type("application/json")
    .body(body))
}
