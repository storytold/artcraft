use std::marker::PhantomData;

use chrono::{DateTime, Utc};
use sqlx::{Executor, MySql};

use enums::common::payments_namespace::PaymentsNamespace;
use tokens::tokens::users::UserToken;

/// The full `user_spend_summaries` record for one (namespace, user).
pub struct UserSpendSummaryRecord {
  pub payments_namespace: PaymentsNamespace,
  pub user_token: UserToken,
  pub lifetime_gross_spend_usd_cents: u64,
  pub lifetime_subscription_spend_usd_cents: u64,
  pub lifetime_credits_spend_usd_cents: u64,
  pub lifetime_refund_usd_cents: u64,
  pub lifetime_net_spend_usd_cents: u64,
  pub lifetime_payment_count: u32,
  pub lifetime_refund_count: u32,
  pub maybe_first_payment_at: Option<DateTime<Utc>>,
  pub first_spend_usd_cents: u64,
  pub maybe_last_payment_at: Option<DateTime<Utc>>,
  pub last_spend_usd_cents: u64,
  pub maybe_days_since_first_payment: Option<u32>,
  pub maybe_days_since_last_payment: Option<u32>,
  pub net_spend_7d_usd_cents: i64,
  pub net_spend_prev_7d_usd_cents: i64,
  pub net_spend_14d_usd_cents: i64,
  pub net_spend_prev_14d_usd_cents: i64,
  pub net_spend_30d_usd_cents: i64,
  pub net_spend_prev_30d_usd_cents: i64,
  pub net_spend_60d_usd_cents: i64,
  pub net_spend_90d_usd_cents: i64,
  pub net_spend_this_year_usd_cents: i64,
  pub avg_weekly_net_spend_4w_usd_cents: i64,
  pub avg_weekly_net_spend_12w_usd_cents: i64,
  pub active_weeks_in_last_4: u8,
  pub active_weeks_in_last_8: u8,
  pub active_weeks_in_last_12: u8,
  pub active_weeks_in_last_24: u8,
  pub active_weeks_in_last_52: u8,
  pub consecutive_active_weeks: u32,
  pub consecutive_inactive_weeks: u32,
  pub maybe_weeks_since_last_spend: Option<u32>,
  pub is_active_subscriber: bool,
  pub maybe_subscription_interval: Option<String>,
  pub maybe_reengagement_score: Option<u32>,
  pub created_at: DateTime<Utc>,
  pub updated_at: DateTime<Utc>,
}

pub struct GetUserSpendSummaryArgs<'e, 'c, E>
where
  E: 'e + Executor<'c, Database = MySql>,
{
  pub payments_namespace: PaymentsNamespace,
  pub user_token: &'e UserToken,
  pub mysql_executor: E,
  pub phantom: PhantomData<&'c E>,
}

pub async fn get_user_spend_summary<'e, 'c: 'e, E>(
  args: GetUserSpendSummaryArgs<'e, 'c, E>,
) -> Result<Option<UserSpendSummaryRecord>, sqlx::Error>
where
  E: 'e + Executor<'c, Database = MySql>,
{
  let row = sqlx::query_as!(
    UserSpendSummaryRecord,
    r#"
SELECT
  payments_namespace AS `payments_namespace!: PaymentsNamespace`,
  user_token AS `user_token!: UserToken`,
  lifetime_gross_spend_usd_cents,
  lifetime_subscription_spend_usd_cents,
  lifetime_credits_spend_usd_cents,
  lifetime_refund_usd_cents,
  lifetime_net_spend_usd_cents,
  lifetime_payment_count,
  lifetime_refund_count,
  first_payment_at AS `maybe_first_payment_at: DateTime<Utc>`,
  first_spend_usd_cents,
  last_payment_at AS `maybe_last_payment_at: DateTime<Utc>`,
  last_spend_usd_cents,
  days_since_first_payment AS `maybe_days_since_first_payment: u32`,
  days_since_last_payment AS `maybe_days_since_last_payment: u32`,
  net_spend_7d_usd_cents,
  net_spend_prev_7d_usd_cents,
  net_spend_14d_usd_cents,
  net_spend_prev_14d_usd_cents,
  net_spend_30d_usd_cents,
  net_spend_prev_30d_usd_cents,
  net_spend_60d_usd_cents,
  net_spend_90d_usd_cents,
  net_spend_this_year_usd_cents,
  avg_weekly_net_spend_4w_usd_cents,
  avg_weekly_net_spend_12w_usd_cents,
  active_weeks_in_last_4,
  active_weeks_in_last_8,
  active_weeks_in_last_12,
  active_weeks_in_last_24,
  active_weeks_in_last_52,
  consecutive_active_weeks,
  consecutive_inactive_weeks,
  weeks_since_last_spend AS `maybe_weeks_since_last_spend: u32`,
  is_active_subscriber AS `is_active_subscriber: bool`,
  maybe_subscription_interval,
  maybe_reengagement_score AS `maybe_reengagement_score: u32`,
  created_at AS `created_at: DateTime<Utc>`,
  updated_at AS `updated_at: DateTime<Utc>`
FROM user_spend_summaries
WHERE payments_namespace = ?
  AND user_token = ?
LIMIT 1
    "#,
    args.payments_namespace.to_str(),
    args.user_token.as_str(),
  )
    .fetch_optional(args.mysql_executor)
    .await?;

  Ok(row)
}
