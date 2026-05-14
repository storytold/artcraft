use crate::errors::database_insert_error::DatabaseInsertError;
use sqlx::{Executor, MySql};
use tokens::tokens::user_referral_codes::UserReferralCodeToken;
use tokens::tokens::users::UserToken;

pub struct CreateReferralCodeArgs<'a> {
  pub owner_user_token: &'a UserToken,
  pub code: &'a str,
  pub code_lowercase: &'a str,
}

pub async fn create_referral_code<'e, 'c: 'e, E>(
  args: CreateReferralCodeArgs<'_>,
  mysql_executor: E,
) -> Result<UserReferralCodeToken, DatabaseInsertError>
where
  E: 'e + Executor<'c, Database = MySql>,
{
  let token = UserReferralCodeToken::generate();

  sqlx::query!(
    r#"
INSERT INTO user_referral_codes (
  token,
  code,
  code_lowercase,
  owner_user_token
)
VALUES (?, ?, ?, ?)
    "#,
    token.as_str(),
    args.code,
    args.code_lowercase,
    args.owner_user_token.as_str(),
  )
    .execute(mysql_executor)
    .await
    .map_err(DatabaseInsertError::from)?;

  Ok(token)
}
