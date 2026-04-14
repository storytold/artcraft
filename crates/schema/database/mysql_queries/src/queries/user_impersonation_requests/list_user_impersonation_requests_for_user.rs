use chrono::{DateTime, Utc};
use sqlx::MySqlPool;

use tokens::tokens::users::UserToken;

pub struct UserImpersonationRequestListItem {
  pub id: u64,
  pub impersonator_user_token: UserToken,
  pub impersonator_username: String,
  pub impersonator_display_name: String,
  pub impersonated_user_token: UserToken,
  pub impersonated_username: String,
  pub impersonated_display_name: String,
  pub is_redeemed: bool,
  pub is_expired: bool,
  pub expires_at: DateTime<Utc>,
  pub created_at: DateTime<Utc>,
  pub updated_at: DateTime<Utc>,
}

pub struct ListUserImpersonationRequestsArgs<'a> {
  pub user_token: &'a str,
  pub maybe_cursor_id: Option<u64>,
  pub limit: u32,
  pub mysql_pool: &'a MySqlPool,
}

pub async fn list_user_impersonation_requests_for_user(
  args: ListUserImpersonationRequestsArgs<'_>,
) -> Result<Vec<UserImpersonationRequestListItem>, sqlx::Error> {

  let limit = args.limit as i64;

  let items = match args.maybe_cursor_id {
    Some(cursor_id) => {
      sqlx::query_as!(
        UserImpersonationRequestListItem,
        r#"
SELECT
  uir.id,
  uir.impersonator_user_token as `impersonator_user_token: UserToken`,
  impersonator.username as impersonator_username,
  impersonator.display_name as impersonator_display_name,
  uir.impersonated_user_token as `impersonated_user_token: UserToken`,
  impersonated.username as impersonated_username,
  impersonated.display_name as impersonated_display_name,
  uir.is_redeemed as `is_redeemed: bool`,
  (uir.expires_at < NOW()) as `is_expired: bool`,
  uir.expires_at,
  uir.created_at,
  uir.updated_at
FROM user_impersonation_requests uir
JOIN users impersonator ON impersonator.token = uir.impersonator_user_token
JOIN users impersonated ON impersonated.token = uir.impersonated_user_token
WHERE uir.impersonated_user_token = ?
  AND uir.id < ?
ORDER BY uir.id DESC
LIMIT ?
        "#,
        args.user_token,
        cursor_id as u64,
        limit,
      )
        .fetch_all(args.mysql_pool)
        .await?
    }
    None => {
      sqlx::query_as!(
        UserImpersonationRequestListItem,
        r#"
SELECT
  uir.id,
  uir.impersonator_user_token as `impersonator_user_token: UserToken`,
  impersonator.username as impersonator_username,
  impersonator.display_name as impersonator_display_name,
  uir.impersonated_user_token as `impersonated_user_token: UserToken`,
  impersonated.username as impersonated_username,
  impersonated.display_name as impersonated_display_name,
  uir.is_redeemed as `is_redeemed: bool`,
  (uir.expires_at < NOW()) as `is_expired: bool`,
  uir.expires_at,
  uir.created_at,
  uir.updated_at
FROM user_impersonation_requests uir
JOIN users impersonator ON impersonator.token = uir.impersonator_user_token
JOIN users impersonated ON impersonated.token = uir.impersonated_user_token
WHERE uir.impersonated_user_token = ?
ORDER BY uir.id DESC
LIMIT ?
        "#,
        args.user_token,
        limit,
      )
        .fetch_all(args.mysql_pool)
        .await?
    }
  };

  Ok(items)
}
