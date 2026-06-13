use std::error::Error;
use std::fmt::{Display, Formatter};

use actix_web::HttpRequest;
use log::warn;
use sqlx::{Executor, MySql};

use mysql_queries::queries::users::user_sessions::get_user_session_by_token::SessionUserRecord;

use crate::state::server_state::ServerState;

#[derive(Debug)]
pub enum RequireModeratorError {
  ServerError,
  NotAuthorized,
}

impl Display for RequireModeratorError {
  fn fmt(&self, f: &mut Formatter<'_>) -> std::fmt::Result {
    match self {
      Self::ServerError => write!(f, "ServerError"),
      Self::NotAuthorized => write!(f, "NotAuthorized"),
    }
  }
}

impl Error for RequireModeratorError {}

/// `mysql_executor` can be any sqlx executor — pass `&server_state.mysql_pool` to grab a
/// fresh connection, or an in-flight connection/transaction (`&mut *connection`) to reuse
/// one the handler already holds.
pub async fn require_moderator<'e, 'c : 'e, E>(
  http_request: &HttpRequest,
  server_state: &ServerState,
  mysql_executor: E,
) -> Result<SessionUserRecord, RequireModeratorError>
  where E: 'e + Executor<'c, Database = MySql>
{
  let maybe_user_session = server_state
      .session_checker
      .maybe_get_user_session_from_executor(http_request, mysql_executor)
      .await
      .map_err(|e| {
        warn!("Session checker error: {:?}", e);
        RequireModeratorError::ServerError
      })?;

  let user_session = match maybe_user_session {
    Some(session) => session,
    None => {
      warn!("not logged in");
      return Err(RequireModeratorError::NotAuthorized);
    }
  };

  if !user_session.is_mod() {
    warn!("user is not a moderator: {:?}", user_session.user_token.as_str());
    return Err(RequireModeratorError::NotAuthorized);
  }

  Ok(user_session)
}
