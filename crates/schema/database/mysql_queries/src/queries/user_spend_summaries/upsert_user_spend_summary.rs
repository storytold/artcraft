use std::marker::PhantomData;

use chrono::{DateTime, Utc};
use sqlx::{Executor, MySql};

use enums::common::payments_namespace::PaymentsNamespace;
use tokens::tokens::users::UserToken;

/// Upsert one `user_spend_summaries` row (recompute-overwrite on the
/// (payments_namespace, user_token) unique key). Window/cadence/score fields are
/// all recomputed each run since they are time-relative.
pub struct UpsertUserSpendSummaryArgs<'e, 'c, E>
where
  E: 'e + Executor<'c, Database = MySql>,
{
  pub payments_namespace: PaymentsNamespace,
  pub user_token: &'e UserToken,

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

  pub net_spend_this_year_usd_cents: i64,

  pub consecutive_active_weeks: u32,
  pub consecutive_inactive_weeks: u32,
  pub maybe_weeks_since_last_spend: Option<u32>,

  pub is_active_subscriber: bool,
  pub maybe_subscription_interval: Option<&'e str>,
  pub maybe_reengagement_score: Option<u32>,

  pub mysql_executor: E,
  pub phantom: PhantomData<&'c E>,
}

pub async fn upsert_user_spend_summary<'e, 'c: 'e, E>(
  args: UpsertUserSpendSummaryArgs<'e, 'c, E>,
) -> Result<(), sqlx::Error>
where
  E: 'e + Executor<'c, Database = MySql>,
{
  sqlx::query!(
    r#"
INSERT INTO user_spend_summaries
SET
  payments_namespace = ?,
  user_token = ?,
  lifetime_gross_spend_usd_cents = ?,
  lifetime_subscription_spend_usd_cents = ?,
  lifetime_credits_spend_usd_cents = ?,
  lifetime_refund_usd_cents = ?,
  lifetime_net_spend_usd_cents = ?,
  lifetime_payment_count = ?,
  lifetime_refund_count = ?,
  first_payment_at = ?,
  first_spend_usd_cents = ?,
  last_payment_at = ?,
  last_spend_usd_cents = ?,
  days_since_first_payment = ?,
  days_since_last_payment = ?,
  net_spend_this_year_usd_cents = ?,
  consecutive_active_weeks = ?,
  consecutive_inactive_weeks = ?,
  weeks_since_last_spend = ?,
  is_active_subscriber = ?,
  maybe_subscription_interval = ?,
  maybe_reengagement_score = ?
ON DUPLICATE KEY UPDATE
  lifetime_gross_spend_usd_cents        = VALUES(lifetime_gross_spend_usd_cents),
  lifetime_subscription_spend_usd_cents = VALUES(lifetime_subscription_spend_usd_cents),
  lifetime_credits_spend_usd_cents      = VALUES(lifetime_credits_spend_usd_cents),
  lifetime_refund_usd_cents             = VALUES(lifetime_refund_usd_cents),
  lifetime_net_spend_usd_cents          = VALUES(lifetime_net_spend_usd_cents),
  lifetime_payment_count                = VALUES(lifetime_payment_count),
  lifetime_refund_count                 = VALUES(lifetime_refund_count),
  first_payment_at                      = VALUES(first_payment_at),
  first_spend_usd_cents                 = VALUES(first_spend_usd_cents),
  last_payment_at                       = VALUES(last_payment_at),
  last_spend_usd_cents                  = VALUES(last_spend_usd_cents),
  days_since_first_payment              = VALUES(days_since_first_payment),
  days_since_last_payment               = VALUES(days_since_last_payment),
  net_spend_this_year_usd_cents         = VALUES(net_spend_this_year_usd_cents),
  consecutive_active_weeks              = VALUES(consecutive_active_weeks),
  consecutive_inactive_weeks            = VALUES(consecutive_inactive_weeks),
  weeks_since_last_spend                = VALUES(weeks_since_last_spend),
  is_active_subscriber                  = VALUES(is_active_subscriber),
  maybe_subscription_interval           = VALUES(maybe_subscription_interval),
  maybe_reengagement_score              = VALUES(maybe_reengagement_score)
    "#,
    args.payments_namespace.to_str(),
    args.user_token.as_str(),
    args.lifetime_gross_spend_usd_cents,
    args.lifetime_subscription_spend_usd_cents,
    args.lifetime_credits_spend_usd_cents,
    args.lifetime_refund_usd_cents,
    args.lifetime_net_spend_usd_cents,
    args.lifetime_payment_count,
    args.lifetime_refund_count,
    args.maybe_first_payment_at,
    args.first_spend_usd_cents,
    args.maybe_last_payment_at,
    args.last_spend_usd_cents,
    args.maybe_days_since_first_payment,
    args.maybe_days_since_last_payment,
    args.net_spend_this_year_usd_cents,
    args.consecutive_active_weeks,
    args.consecutive_inactive_weeks,
    args.maybe_weeks_since_last_spend,
    args.is_active_subscriber,
    args.maybe_subscription_interval,
    args.maybe_reengagement_score,
  )
    .execute(args.mysql_executor)
    .await?;

  Ok(())
}
