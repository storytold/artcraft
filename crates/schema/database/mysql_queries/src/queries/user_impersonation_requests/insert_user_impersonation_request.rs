use std::marker::PhantomData;

use chrono::{DateTime, Utc};
use sqlx::{Executor, MySql};

use tokens::tokens::user_impersonation_requests::UserImpersonationRequestToken;
use tokens::tokens::users::UserToken;

pub struct InsertUserImpersonationRequestArgs<'a, 'c: 'a, E>
  where E: 'a + Executor<'c, Database = MySql>
{
  pub impersonated_user_token: &'a UserToken,
  pub impersonator_user_token: &'a UserToken,
  pub user_impersonation_token: &'a str,
  pub ip_address_creation: &'a str,
  pub expires_at: DateTime<Utc>,

  pub mysql_executor: E,
  pub phantom: PhantomData<&'c E>,
}

pub async fn insert_user_impersonation_request<'a, 'c, E>(
  args: InsertUserImpersonationRequestArgs<'a, 'c, E>,
) -> Result<UserImpersonationRequestToken, sqlx::Error>
  where E: 'a + Executor<'c, Database = MySql>
{
  let token = UserImpersonationRequestToken::generate();

  sqlx::query!(
    r#"
INSERT INTO user_impersonation_requests
SET
  token = ?,
  impersonated_user_token = ?,
  impersonator_user_token = ?,
  user_impersonation_token = ?,
  ip_address_creation = ?,
  expires_at = ?
    "#,
    token.as_str(),
    args.impersonated_user_token.as_str(),
    args.impersonator_user_token.as_str(),
    args.user_impersonation_token,
    args.ip_address_creation,
    args.expires_at,
  )
    .execute(args.mysql_executor)
    .await?;

  Ok(token)
}
