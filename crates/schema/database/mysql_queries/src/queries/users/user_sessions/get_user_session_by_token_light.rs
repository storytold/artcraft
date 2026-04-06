// NB: Incrementally getting rid of build warnings...
#![forbid(unused_imports)]
#![forbid(unused_mut)]

use log::warn;
use sqlx::{Executor, MySql};

#[derive(Clone, Serialize, Deserialize)]
pub struct SessionRecord {
  pub session_token: String,
  pub user_token: String,
}

pub async fn get_user_session_by_token_light<'e, 'c : 'e, E>(
  mysql_executor: E,
  session_token: &str,
) -> Result<Option<SessionRecord>, sqlx::Error>
  where E: 'e + Executor<'c, Database = MySql>
{
  let maybe_session_record = sqlx::query_as!(
      SessionRecord,
        r#"
SELECT
    token as session_token,
    user_token
FROM user_sessions
WHERE token = ?
AND deleted_at IS NULL
        "#,
        session_token,
    )
      .fetch_one(mysql_executor)
      .await;

  match maybe_session_record {
    Ok(session_record) => Ok(Some(session_record)),
    Err(sqlx::Error::RowNotFound) => {
      warn!("Valid cookie; invalid session: {}", session_token);
      Ok(None)
    },
    Err(err) => {
      warn!("Session query error: {:?}", err);
      Err(err)
    }
  }
}
