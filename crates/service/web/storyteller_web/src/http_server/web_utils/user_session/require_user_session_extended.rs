use std::error::Error;
use std::fmt::{Display, Formatter};

use actix_web::HttpRequest;
use log::warn;
use sqlx::{Acquire, MySql};

use crate::http_server::session::lookup::user_session_extended::UserSessionExtended;
use crate::http_server::session::session_checker::SessionChecker;

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

/// `mysql_executor` can be any sqlx acquirer — pass `&server_state.mysql_pool` to grab a
/// fresh connection, or an in-flight connection (`&mut connection`) to reuse one the handler
/// already holds. (The extended lookup runs two queries, so it acquires a connection rather
/// than taking a bare `Executor`.)
pub async fn require_user_session_extended<'a, A>(
  http_request: &HttpRequest,
  session_checker: &SessionChecker,
  mysql_executor: A,
) -> Result<UserSessionExtended, RequireUserSessionError>
  where A: Acquire<'a, Database = MySql>
{
  let maybe_user_session = session_checker
      .maybe_get_user_session_extended_from_executor(http_request, mysql_executor)
      .await
      .map_err(|e| {
        warn!("Session checker error: {:?}", e);
        RequireUserSessionError::ServerError
      })?;

  let user_session = match maybe_user_session {
    Some(session) => session,
    None => {
      warn!("not logged in");
      return Err(RequireUserSessionError::NotAuthorized);
    }
  };

  if user_session.role.is_banned {
    warn!("user is banned: {:?}", user_session.user_token.as_str());
    return Err(RequireUserSessionError::NotAuthorized);
  }

  Ok(user_session)
}
