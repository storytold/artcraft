use actix_web::HttpRequest;
use log::warn;
use sqlx::pool::PoolConnection;
use sqlx::MySql;

use mysql_queries::queries::users::user_sessions::get_user_session_by_token::SessionUserRecord;

use crate::http_server::session::session_checker::SessionChecker;
use crate::http_server::web_utils::user_session::require_user_session::RequireUserSessionError;

pub async fn require_user_session_using_connection(
  http_request: &HttpRequest,
  session_checker: &SessionChecker,
  mysql_connection: &mut PoolConnection<MySql>,
) -> Result<SessionUserRecord, RequireUserSessionError> {

  let maybe_user_session = session_checker
      .maybe_get_user_session_from_connection(http_request, mysql_connection)
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

  if user_session.is_banned {
    warn!("user is banned: {:?}", user_session.user_token.as_str());
    return Err(RequireUserSessionError::NotAuthorized);
  }

  Ok(user_session)
}
