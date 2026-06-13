use actix_web::HttpRequest;
use log::warn;
use sqlx::MySqlConnection;

use crate::http_server::common_responses::common_web_error::CommonWebError;
use crate::http_server::session::lookup::user_session_extended::UserSessionExtended;
use crate::http_server::session::session_checker::SessionChecker;

/// Pass an in-flight connection (`&mut *connection`) to reuse one the handler already holds.
/// (The extended lookup runs two queries, so it takes a concrete `&mut MySqlConnection` — which
/// it reborrows for each — rather than a by-value `Executor` that the first query would consume.)
pub async fn require_user_session_extended(
  http_request: &HttpRequest,
  session_checker: &SessionChecker,
  mysql_executor: &mut MySqlConnection,
) -> Result<UserSessionExtended, CommonWebError>
{
  let maybe_user_session = session_checker
      .maybe_get_user_session_extended_from_executor(http_request, mysql_executor)
      .await
      .map_err(|e| {
        warn!("Session checker error: {:?}", e);
        CommonWebError::from_error(e)
      })?;

  let user_session = match maybe_user_session {
    Some(session) => session,
    None => {
      warn!("not logged in");
      return Err(CommonWebError::NotAuthorized);
    }
  };

  if user_session.role.is_banned {
    warn!("user is banned: {:?}", user_session.user_token.as_str());
    return Err(CommonWebError::NotAuthorized);
  }

  Ok(user_session)
}
