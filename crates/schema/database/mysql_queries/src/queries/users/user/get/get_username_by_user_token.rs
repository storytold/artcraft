use log::warn;
use sqlx::MySqlPool;

use crate::errors::select_optional_record_error::SelectOptionalRecordError;
use tokens::tokens::users::UserToken;

pub struct UsernameDetails {
  pub username: String,
  pub display_name: String,
  pub username_is_generated: bool,
  pub username_is_not_customized: bool,
}

pub async fn get_username_by_user_token(
  user_token: &UserToken,
  pool: &MySqlPool,
) -> Result<Option<UsernameDetails>, SelectOptionalRecordError> {
  let result = sqlx::query_as!(
    UsernameDetails,
    r#"
SELECT
  username,
  display_name,
  username_is_generated as `username_is_generated: bool`,
  username_is_not_customized as `username_is_not_customized: bool`
FROM users
WHERE
  token = ?
  AND user_deleted_at IS NULL
  AND mod_deleted_at IS NULL
LIMIT 1
    "#,
    user_token.as_str(),
  )
    .fetch_optional(pool)
    .await;

  match result {
    Ok(maybe_record) => Ok(maybe_record),
    Err(err) => {
      warn!("get_username_by_user_token query error: {:?}", err);
      Err(err.into())
    }
  }
}
