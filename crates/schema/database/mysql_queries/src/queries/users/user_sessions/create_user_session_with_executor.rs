use log::info;
use sqlx::{Executor, MySql};
use tokens::tokens::user_sessions::UserSessionToken;
use tokens::tokens::users::UserToken;

pub async fn create_user_session_with_executor<'e, 'c: 'e, E>(
  user_token: &UserToken,
  ip_address: &str,
  mysql_executor: E,
) -> Result<UserSessionToken, sqlx::Error>
where
  E: 'e + Executor<'c, Database = MySql>,
{
  let session_token = UserSessionToken::generate();

  let result = sqlx::query!(
    r#"
INSERT INTO user_sessions (
  token,
  user_token,
  ip_address_creation,
  expires_at
)
VALUES ( ?, ?, ?, NOW() + interval 1 year )
    "#,
    session_token.as_str(),
    user_token.as_str(),
    ip_address,
  )
    .execute(mysql_executor)
    .await?;

  info!("Created session id: {}", result.last_insert_id());

  Ok(session_token)
}
