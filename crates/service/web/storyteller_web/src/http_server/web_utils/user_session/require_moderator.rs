use std::error::Error;
use std::fmt::{Display, Formatter};
use std::marker::PhantomData;

use actix_web::HttpRequest;
use log::warn;
use sqlx::{Executor, MySql};

use mysql_queries::queries::users::user_sessions::get_user_session_by_token::SessionUserRecord;

use crate::state::server_state::ServerState;

pub struct RequireModeratorArgs<'e, 'c, E>
  where E: 'e + Executor<'c, Database = MySql>
{
  pub http_request: &'e HttpRequest,
  pub server_state: &'e ServerState,

  /// The executor to run the session lookup against. Pass `&server_state.mysql_pool` to
  /// grab a fresh connection, or an in-flight connection (`&mut *connection`) to reuse one
  /// the handler already holds.
  pub mysql_executor: E,

  // NB: phantom can be passed as `Default::default()`.
  pub phantom: PhantomData<&'c E>,
}

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

pub async fn require_moderator<'e, 'c : 'e, E>(
  args: RequireModeratorArgs<'e, 'c, E>,
) -> Result<SessionUserRecord, RequireModeratorError>
  where E: 'e + Executor<'c, Database = MySql>
{
  let maybe_user_session = args.server_state
      .session_checker
      .maybe_get_user_session_from_executor(args.http_request, args.mysql_executor)
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
