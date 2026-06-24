use std::fmt;
use std::sync::Arc;

use actix_web::error::ResponseError;
use actix_web::web::Json;
use actix_web::http::StatusCode;
use actix_web::{web, HttpRequest, HttpResponse};
use log::warn;
use utoipa::ToSchema;

use http_server_common::request::get_request_ip::get_request_ip;
use mysql_queries::queries::browser_session_logs::upsert_browser_session_log::{upsert_browser_session_log, UpsertBrowserSessionLogArgs};
use tokens::tokens::browser_session_logs::BrowserSessionLogToken;

use crate::http_server::web_utils::response_error_helpers::to_simple_json_error;
use crate::state::server_state::ServerState;

#[derive(Deserialize, ToSchema)]
pub struct LogBrowserSessionRequest {
  /// Make the first request to this endpoint without a token.
  /// The server will give you a token to use for every subsequent call.
  /// Using this, we can calculate how sticky product usage is.
  maybe_log_token: Option<BrowserSessionLogToken>,

  /// OPTIONAL: Optionally include an up to 32-character identifier of what
  /// action the user was last performing.
  maybe_last_action: Option<String>,
}

#[derive(Serialize, ToSchema)]
pub struct LogBrowserSessionSuccessResponse {
  pub success: bool,

  /// Store and use this token in subsequent requests.
  /// If the user closes the browser, do not save it in session storage.
  /// You can get a new token with each browser session.
  pub log_token: BrowserSessionLogToken,
}

#[derive(Debug, ToSchema)]
pub enum LogBrowserSessionError {
  BadInput(String),
  NotAuthorized,
  ServerError,
}

impl ResponseError for LogBrowserSessionError {
  fn status_code(&self) -> StatusCode {
    match *self {
      LogBrowserSessionError::BadInput(_) => StatusCode::BAD_REQUEST,
      LogBrowserSessionError::NotAuthorized => StatusCode::UNAUTHORIZED,
      LogBrowserSessionError::ServerError => StatusCode::INTERNAL_SERVER_ERROR,
    }
  }

  fn error_response(&self) -> HttpResponse {
    let error_reason = match self {
      LogBrowserSessionError::BadInput(reason) => reason.to_string(),
      LogBrowserSessionError::NotAuthorized => "unauthorized".to_string(),
      LogBrowserSessionError::ServerError => "server error".to_string(),
    };

    to_simple_json_error(&error_reason, self.status_code())
  }
}

// NB: Not using derive_more::Display since Clion doesn't understand it.
impl fmt::Display for LogBrowserSessionError {
  fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
    write!(f, "{:?}", self)
  }
}

/// Log a browser session (so we can calculate duration, etc.)
#[utoipa::path(
  post,
  tag = "Analytics",
  path = "/v1/analytics/log_session",
  responses(
    (status = 200, description = "Success", body = LogBrowserSessionSuccessResponse),
    (status = 400, description = "Bad input", body = LogBrowserSessionError),
    (status = 401, description = "Not authorized", body = LogBrowserSessionError),
    (status = 500, description = "Server error", body = LogBrowserSessionError),
  ),
  params(
    ("request" = LogBrowserSessionRequest, description = "Payload for Request"),
  )
)]
pub async fn log_browser_session_handler(
  http_request: HttpRequest,
  request: Json<LogBrowserSessionRequest>,
  server_state: web::Data<Arc<ServerState>>,
) -> Result<Json<LogBrowserSessionSuccessResponse>, LogBrowserSessionError>
{
  let mut mysql_connection = server_state.mysql_pool
      .acquire()
      .await
      .map_err(|err| {
        warn!("MySql pool error: {:?}", err);
        LogBrowserSessionError::ServerError
      })?;

  let maybe_user_session = server_state
      .session_checker
      .maybe_get_user_session_from_connection(&http_request, &mut mysql_connection)
      .await
      .map_err(|e| {
        warn!("Session checker error: {:?}", e);
        LogBrowserSessionError::ServerError
      })?;

  let maybe_avt_token = server_state
      .avt_cookie_manager
      .get_avt_token_from_request(&http_request);

  let ip_address = get_request_ip(&http_request);

  let token = upsert_browser_session_log(UpsertBrowserSessionLogArgs {
    maybe_log_token: request.maybe_log_token.as_ref(),
    ip_address: &ip_address,
    maybe_user_token: maybe_user_session.as_ref().map(|s| &s.user_token),
    maybe_visitor_token: maybe_avt_token.as_ref(),
    maybe_last_action: request.maybe_last_action.as_deref(),
    mysql_pool: &server_state.mysql_pool,
  }).await.map_err(|err| {
    warn!("Error inserting beta keys: {:?}", err);
    LogBrowserSessionError::ServerError
  })?;

  let response = LogBrowserSessionSuccessResponse {
    success: true,
    log_token: token,
  };

  Ok(Json(response))
}

