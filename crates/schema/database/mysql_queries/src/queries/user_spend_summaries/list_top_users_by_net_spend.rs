use std::marker::PhantomData;

use sqlx::{Executor, MySql};

use tokens::tokens::users::UserToken;

/// A top spender joined to display info, with all net-spend windows so the
/// caller can render the one it sorted by.
pub struct TopUserByNetSpend {
  pub user_token: UserToken,
  pub username: String,
  pub display_name: String,
  pub email_gravatar_hash: String,
  pub lifetime_net_spend_usd_cents: u64,
  pub net_spend_7d_usd_cents: i64,
  pub net_spend_14d_usd_cents: i64,
  pub net_spend_30d_usd_cents: i64,
  pub net_spend_60d_usd_cents: i64,
  pub net_spend_90d_usd_cents: i64,
  pub net_spend_this_year_usd_cents: i64,
  pub is_active_subscriber: bool,
  pub maybe_reengagement_score: Option<u32>,
}

pub struct ListTopUsersByNetSpendArgs<'e, 'c, E>
where
  E: 'e + Executor<'c, Database = MySql>,
{
  pub payments_namespace: &'e str,
  /// One of: 7d, 14d, 30d, 60d, 90d, 1y, lifetime. Selects the sort column.
  pub window: &'e str,
  pub limit: i64,
  pub offset: i64,
  pub mysql_executor: E,
  pub phantom: PhantomData<&'c E>,
}

/// Top spenders for a namespace, sorted by net spend over the requested window.
pub async fn list_top_users_by_net_spend<'e, 'c: 'e, E>(
  args: ListTopUsersByNetSpendArgs<'e, 'c, E>,
) -> Result<Vec<TopUserByNetSpend>, sqlx::Error>
where
  E: 'e + Executor<'c, Database = MySql>,
{
  let rows = sqlx::query_as!(
    TopUserByNetSpend,
    r#"
SELECT
  s.user_token AS `user_token!: UserToken`,
  u.username AS `username!`,
  u.display_name AS `display_name!`,
  u.email_gravatar_hash AS `email_gravatar_hash!`,
  s.lifetime_net_spend_usd_cents,
  s.net_spend_7d_usd_cents,
  s.net_spend_14d_usd_cents,
  s.net_spend_30d_usd_cents,
  s.net_spend_60d_usd_cents,
  s.net_spend_90d_usd_cents,
  s.net_spend_this_year_usd_cents,
  s.is_active_subscriber AS `is_active_subscriber: bool`,
  s.maybe_reengagement_score AS `maybe_reengagement_score: u32`
FROM user_spend_summaries s
JOIN users u ON u.token = s.user_token
WHERE s.payments_namespace = ?
ORDER BY
  (CASE ?
     WHEN '7d'  THEN s.net_spend_7d_usd_cents
     WHEN '14d' THEN s.net_spend_14d_usd_cents
     WHEN '30d' THEN s.net_spend_30d_usd_cents
     WHEN '60d' THEN s.net_spend_60d_usd_cents
     WHEN '90d' THEN s.net_spend_90d_usd_cents
     WHEN '1y'  THEN s.net_spend_this_year_usd_cents
     ELSE CAST(s.lifetime_net_spend_usd_cents AS SIGNED)
   END) DESC,
  s.id ASC
LIMIT ? OFFSET ?
    "#,
    args.payments_namespace,
    args.window,
    args.limit,
    args.offset,
  )
    .fetch_all(args.mysql_executor)
    .await?;

  Ok(rows)
}
