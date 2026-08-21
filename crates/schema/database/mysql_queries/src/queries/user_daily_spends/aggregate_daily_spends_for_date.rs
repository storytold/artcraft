use std::marker::PhantomData;

use chrono::{DateTime, Utc};
use sqlx::{Executor, MySql};

use enums::common::payments_namespace::PaymentsNamespace;
use tokens::tokens::users::UserToken;

/// One (user, namespace) aggregate of spend activity for a single UTC day,
/// computed from `user_spend_events`. Only produced for (user, day) pairs that
/// actually had spend or refund activity (sparse — see the HAVING clause).
pub struct DailySpendAggregate {
  pub user_token: UserToken,
  pub payments_namespace: PaymentsNamespace,
  pub subscription_spend_usd_cents: u64,
  pub credits_spend_usd_cents: u64,
  pub gross_spend_usd_cents: u64,
  pub refund_usd_cents: u64,
  pub net_spend_usd_cents: i64,
  pub payment_count: u64,
  pub credits_granted: u64,
}

pub struct AggregateDailySpendsForDateArgs<'c, E>
where
  E: Executor<'c, Database = MySql>,
{
  /// Inclusive start of the UTC day.
  pub range_start: DateTime<Utc>,
  /// Exclusive end of the UTC day (start + 1 day).
  pub range_end: DateTime<Utc>,
  pub mysql_executor: E,
  pub phantom: PhantomData<&'c E>,
}

/// Aggregate spend events for one UTC day, grouped by (user, namespace). Rows
/// with neither spend nor refund are excluded so `user_daily_spends` stays
/// sparse. Only attributed events (non-null user) are counted.
pub async fn aggregate_daily_spends_for_date<'c, E>(
  args: AggregateDailySpendsForDateArgs<'c, E>,
) -> Result<Vec<DailySpendAggregate>, sqlx::Error>
where
  E: Executor<'c, Database = MySql>,
{
  let rows = sqlx::query_as!(
    DailySpendAggregate,
    r#"
SELECT
  maybe_user_token AS `user_token!: UserToken`,
  payments_namespace AS `payments_namespace!: PaymentsNamespace`,
  CAST(SUM(CASE WHEN amount_usd_cents > 0
                 AND event_type IN ('subscription_initial', 'subscription_renewal', 'subscription_proration_upgrade')
            THEN amount_usd_cents ELSE 0 END) AS UNSIGNED) AS `subscription_spend_usd_cents!: u64`,
  CAST(SUM(CASE WHEN amount_usd_cents > 0 AND event_type = 'credit_pack_purchase'
            THEN amount_usd_cents ELSE 0 END) AS UNSIGNED) AS `credits_spend_usd_cents!: u64`,
  CAST(SUM(CASE WHEN amount_usd_cents > 0 THEN amount_usd_cents ELSE 0 END) AS UNSIGNED) AS `gross_spend_usd_cents!: u64`,
  CAST(SUM(CASE WHEN amount_usd_cents < 0 THEN -amount_usd_cents ELSE 0 END) AS UNSIGNED) AS `refund_usd_cents!: u64`,
  CAST(SUM(amount_usd_cents) AS SIGNED) AS `net_spend_usd_cents!: i64`,
  CAST(SUM(CASE WHEN amount_usd_cents > 0 THEN 1 ELSE 0 END) AS UNSIGNED) AS `payment_count!: u64`,
  CAST(COALESCE(SUM(maybe_credits_granted), 0) AS UNSIGNED) AS `credits_granted!: u64`
FROM user_spend_events
WHERE maybe_user_token IS NOT NULL
  AND is_production = TRUE
  AND payment_occurred_at >= ?
  AND payment_occurred_at < ?
GROUP BY maybe_user_token, payments_namespace
HAVING SUM(CASE WHEN amount_usd_cents <> 0 THEN 1 ELSE 0 END) > 0
    "#,
    args.range_start,
    args.range_end,
  )
    .fetch_all(args.mysql_executor)
    .await?;

  Ok(rows)
}
