use std::error::Error;
use std::fmt::{Display, Formatter};

use actix_web::HttpRequest;
use log::warn;

use mysql_queries::queries::users::user_sessions::get_user_session_by_token::SessionUserRecord;

use crate::http_server::web_utils::user_session::require_user_session_using_connection::require_user_session_using_connection;
use crate::state::server_state::ServerState;

#[derive(Debug)]
pub enum RequireUserSessionError {
  ServerError,
  NotAuthorized,
}

impl Display for RequireUserSessionError {
  fn fmt(&self, f: &mut Formatter<'_>) -> std::fmt::Result {
    match self {
      Self::ServerError => write!(f, "ServerError"),
      Self::NotAuthorized => write!(f, "NotAuthorized"),
    }
  }
}

impl Error for RequireUserSessionError {}

#[deprecated(note = "Use require_user_session_using_connection instead, which reuses an existing connection")]
pub async fn require_user_session(
  http_request: &HttpRequest,
  server_state: &ServerState,
) -> Result<SessionUserRecord, RequireUserSessionError> {

  let mut mysql_connection = server_state.mysql_pool
      .acquire()
      .await
      .map_err(|err| {
        warn!("MySql pool error: {:?}", err);
        RequireUserSessionError::ServerError
      })?;

  require_user_session_using_connection(
      http_request, &server_state.session_checker, &mut mysql_connection)
      .await
}
