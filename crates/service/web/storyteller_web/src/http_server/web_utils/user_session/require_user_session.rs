use actix_web::HttpRequest;
use log::warn;
use sqlx::{Executor, MySql};

use mysql_queries::queries::users::user_sessions::get_user_session_by_token::SessionUserRecord;

use crate::http_server::common_responses::common_web_error::CommonWebError;
use crate::http_server::session::session_checker::SessionChecker;

/// `mysql_executor` can be any sqlx executor — pass `&server_state.mysql_pool` to grab a
/// fresh connection, or an in-flight connection/transaction (`&mut *connection`) to reuse
/// one the handler already holds.
pub async fn require_user_session<'e, 'c : 'e, E>(
  http_request: &HttpRequest,
  session_checker: &SessionChecker,
  mysql_executor: E,
) -> Result<SessionUserRecord, CommonWebError>
  where E: 'e + Executor<'c, Database = MySql>
{
  let maybe_user_session = session_checker
      .maybe_get_user_session_from_executor(http_request, mysql_executor)
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

  if user_session.is_banned {
    warn!("user is banned: {:?}", user_session.user_token.as_str());
    return Err(CommonWebError::NotAuthorized);
  }

  Ok(user_session)
}
