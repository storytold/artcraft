use std::marker::PhantomData;

use chrono::{DateTime, Utc};
use sqlx::{Executor, MySql};

use tokens::tokens::users::UserToken;

/// One user's aggregated spend within the requested window, joined to their
/// display info. Only attributed (non-null user), production events count.
pub struct TopSpenderForWindow {
  pub user_token: UserToken,
  pub username: String,
  pub display_name: String,
  pub email_gravatar_hash: String,
  pub gross_spend_usd_cents: u64,
  pub refund_usd_cents: u64,
  pub net_spend_usd_cents: i64,
  pub payment_count: u64,
  pub credits_granted: u64,
}

pub struct ListTopSpendersForWindowArgs<'e, 'c, E>
where
  E: 'e + Executor<'c, Database = MySql>,
{
  /// Inclusive start of the aggregation window.
  pub window_start: DateTime<Utc>,
  /// Optional namespace filter. `None` aggregates across all namespaces.
  pub maybe_payments_namespace: Option<&'e str>,
  pub limit: i64,
  pub offset: i64,
  pub mysql_executor: E,
  pub phantom: PhantomData<&'c E>,
}

/// Top spenders since `window_start`, sorted by net spend descending.
/// Aggregates `user_spend_events` directly (exact rolling windows, unlike the
/// daily rollups) — the table is payment-scale, so this stays cheap.
pub async fn list_top_spenders_for_window<'e, 'c: 'e, E>(
  args: ListTopSpendersForWindowArgs<'e, 'c, E>,
) -> Result<Vec<TopSpenderForWindow>, sqlx::Error>
where
  E: 'e + Executor<'c, Database = MySql>,
{
  let rows = sqlx::query_as!(
    TopSpenderForWindow,
    r#"
SELECT
  e.maybe_user_token AS `user_token!: UserToken`,
  u.username AS `username!`,
  u.display_name AS `display_name!`,
  u.email_gravatar_hash AS `email_gravatar_hash!`,
  CAST(SUM(CASE WHEN e.amount_usd_cents > 0 THEN e.amount_usd_cents ELSE 0 END) AS UNSIGNED) AS `gross_spend_usd_cents!: u64`,
  CAST(SUM(CASE WHEN e.amount_usd_cents < 0 THEN -e.amount_usd_cents ELSE 0 END) AS UNSIGNED) AS `refund_usd_cents!: u64`,
  CAST(SUM(e.amount_usd_cents) AS SIGNED) AS `net_spend_usd_cents!: i64`,
  CAST(SUM(CASE WHEN e.amount_usd_cents > 0 THEN 1 ELSE 0 END) AS UNSIGNED) AS `payment_count!: u64`,
  CAST(COALESCE(SUM(e.maybe_credits_granted), 0) AS UNSIGNED) AS `credits_granted!: u64`
FROM user_spend_events e
JOIN users u ON u.token = e.maybe_user_token
WHERE e.maybe_user_token IS NOT NULL
  AND e.is_production = TRUE
  AND e.payment_occurred_at >= ?
  AND (? IS NULL OR e.payments_namespace = ?)
GROUP BY e.maybe_user_token, u.username, u.display_name, u.email_gravatar_hash
ORDER BY SUM(e.amount_usd_cents) DESC, e.maybe_user_token ASC
LIMIT ? OFFSET ?
    "#,
    args.window_start,
    args.maybe_payments_namespace,
    args.maybe_payments_namespace,
    args.limit,
    args.offset,
  )
    .fetch_all(args.mysql_executor)
    .await?;

  Ok(rows)
}
