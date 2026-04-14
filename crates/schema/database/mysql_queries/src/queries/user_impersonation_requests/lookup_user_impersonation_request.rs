use chrono::{DateTime, Utc};
use sqlx::MySqlPool;

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
  let maybe_record = sqlx::query_as!(
    UserImpersonationRequestRecord,
    r#"
SELECT
  token,
  impersonated_user_token as `impersonated_user_token: UserToken`,
  impersonator_user_token as `impersonator_user_token: UserToken`,
  public_impersonation_token,
  is_redeemed as `is_redeemed: bool`,
  expires_at
FROM user_impersonation_requests
WHERE public_impersonation_token = ?
LIMIT 1
    "#,
    public_impersonation_token,
  )
    .fetch_optional(mysql_pool)
    .await?;

  Ok(maybe_record)
}
