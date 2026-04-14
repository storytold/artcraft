use chrono::{DateTime, Utc};
use sqlx::{MySqlPool, Row};

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

  let rows = match args.maybe_cursor_id {
    Some(cursor_id) => {
      let cursor_id = cursor_id as i64;
      sqlx::query(
        r#"
SELECT
  uir.id,
  uir.impersonator_user_token,
  impersonator.username as impersonator_username,
  impersonator.display_name as impersonator_display_name,
  uir.impersonated_user_token,
  impersonated.username as impersonated_username,
  impersonated.display_name as impersonated_display_name,
  uir.is_redeemed,
  (uir.expires_at < NOW()) as is_expired,
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
      )
        .bind(args.user_token)
        .bind(cursor_id)
        .bind(limit)
        .fetch_all(args.mysql_pool)
        .await?
    }
    None => {
      sqlx::query(
        r#"
SELECT
  uir.id,
  uir.impersonator_user_token,
  impersonator.username as impersonator_username,
  impersonator.display_name as impersonator_display_name,
  uir.impersonated_user_token,
  impersonated.username as impersonated_username,
  impersonated.display_name as impersonated_display_name,
  uir.is_redeemed,
  (uir.expires_at < NOW()) as is_expired,
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
      )
        .bind(args.user_token)
        .bind(limit)
        .fetch_all(args.mysql_pool)
        .await?
    }
  };

  let items = rows.into_iter().map(|row| {
    UserImpersonationRequestListItem {
      id: row.get::<i64, _>("id") as u64,
      impersonator_user_token: UserToken::new_from_str(row.get("impersonator_user_token")),
      impersonator_username: row.get("impersonator_username"),
      impersonator_display_name: row.get("impersonator_display_name"),
      impersonated_user_token: UserToken::new_from_str(row.get("impersonated_user_token")),
      impersonated_username: row.get("impersonated_username"),
      impersonated_display_name: row.get("impersonated_display_name"),
      is_redeemed: row.get("is_redeemed"),
      is_expired: row.get::<i64, _>("is_expired") != 0,
      expires_at: row.get("expires_at"),
      created_at: row.get("created_at"),
      updated_at: row.get("updated_at"),
    }
  }).collect();

  Ok(items)
}
