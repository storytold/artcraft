use std::error::Error;
use std::fmt::{Display, Formatter};

use actix_web::HttpRequest;
use log::warn;
use sqlx::pool::PoolConnection;
use sqlx::MySql;

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

pub enum UseDatabase<'a> {
  GrabNewConnection,
  FromPool(&'a mut PoolConnection<MySql>),
}

pub async fn require_moderator(
  http_request: &HttpRequest,
  server_state: &ServerState,
  database: UseDatabase<'_>,
) -> Result<SessionUserRecord, RequireModeratorError> {
  // NB: Save a reference to a connection we open in a branch until the function ends.
  let mut saved_connection = None;

  let mysql_connection = match database {
    UseDatabase::GrabNewConnection => {
      let mut connection = server_state.mysql_pool
          .acquire()
          .await
          .map_err(|err| {
            warn!("MySql pool error: {:?}", err);
            RequireModeratorError::ServerError
          })?;

      saved_connection = Some(connection);

      // NB: We just saved it, so it shouldn't error. Safer than unwrap/expect.
      saved_connection.as_mut().ok_or(RequireModeratorError::ServerError)?
    },
    UseDatabase::FromPool(pool) => pool,
  };

  let maybe_user_session = server_state
      .session_checker
      .maybe_get_user_session_from_connection(&http_request, mysql_connection)
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
