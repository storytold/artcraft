use chrono::{DateTime, Utc};
use sqlx::{FromRow, MySqlPool, Row};

use tokens::tokens::users::UserToken;

pub struct UserImpersonationRequestRecord {
  pub token: String,
  pub impersonated_user_token: UserToken,
  pub impersonator_user_token: UserToken,
  pub public_impersonation_token: String,
  pub is_redeemed: bool,
  pub expires_at: DateTime<Utc>,
}

/// Look up a user impersonation request by the public impersonation token (the "password").
pub async fn lookup_user_impersonation_request(
  public_impersonation_token: &str,
  mysql_pool: &MySqlPool,
) -> Result<Option<UserImpersonationRequestRecord>, sqlx::Error> {
  let maybe_row = sqlx::query(
    r#"
SELECT
  token,
  impersonated_user_token,
  impersonator_user_token,
  public_impersonation_token,
  is_redeemed,
  expires_at
FROM user_impersonation_requests
WHERE public_impersonation_token = ?
LIMIT 1
    "#,
  )
    .bind(public_impersonation_token)
    .fetch_optional(mysql_pool)
    .await?;

  let row = match maybe_row {
    Some(row) => row,
    None => return Ok(None),
  };

  Ok(Some(UserImpersonationRequestRecord {
    token: row.get("token"),
    impersonated_user_token: UserToken::new_from_str(row.get("impersonated_user_token")),
    impersonator_user_token: UserToken::new_from_str(row.get("impersonator_user_token")),
    public_impersonation_token: row.get("public_impersonation_token"),
    is_redeemed: row.get("is_redeemed"),
    expires_at: row.get("expires_at"),
  }))
}
