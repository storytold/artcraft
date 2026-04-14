use std::marker::PhantomData;

use chrono::{DateTime, Utc};
use sqlx::{Executor, MySql};

use tokens::tokens::user_sessions::UserSessionToken;
use tokens::tokens::users::UserToken;

pub struct CreateImpersonatedUserSessionArgs<'a, 'c: 'a, E>
  where E: 'a + Executor<'c, Database = MySql>
{
  /// The user being impersonated (the session will act as this user).
  pub user_token: &'a UserToken,

  /// The staff/moderator user who initiated the impersonation.
  pub impersonator_user_token: &'a UserToken,

  pub ip_address: &'a str,
  pub expires_at: DateTime<Utc>,

  pub mysql_executor: E,
  pub phantom: PhantomData<&'c E>,
}

pub async fn create_impersonated_user_session<'a, 'c, E>(
  args: CreateImpersonatedUserSessionArgs<'a, 'c, E>,
) -> Result<UserSessionToken, sqlx::Error>
  where E: 'a + Executor<'c, Database = MySql>
{
  let session_token = UserSessionToken::generate();

  sqlx::query!(
    r#"
INSERT INTO user_sessions (
  token,
  user_token,
  maybe_impersonation_user_token,
  ip_address_creation,
  expires_at
)
VALUES (?, ?, ?, ?, ?)
    "#,
    session_token.as_str(),
    args.user_token.as_str(),
    args.impersonator_user_token.as_str(),
    args.ip_address,
    args.expires_at,
  )
    .execute(args.mysql_executor)
    .await?;

  Ok(session_token)
}
