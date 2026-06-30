use std::marker::PhantomData;

use chrono::NaiveDate;
use sqlx::{Executor, MySql};

use enums::common::payments_namespace::PaymentsNamespace;
use tokens::tokens::users::UserToken;

/// Upsert one `user_daily_spends` row (recompute-overwrite on the
/// (user, namespace, date) unique key).
pub struct UpsertUserDailySpendArgs<'e, 'c, E>
where
  E: 'e + Executor<'c, Database = MySql>,
{
  pub user_token: &'e UserToken,
  pub payments_namespace: PaymentsNamespace,
  pub spend_date: NaiveDate,
  pub subscription_spend_usd_cents: u64,
  pub credits_spend_usd_cents: u64,
  pub gross_spend_usd_cents: u64,
  pub refund_usd_cents: u64,
  pub net_spend_usd_cents: i64,
  pub payment_count: u32,
  pub credits_granted: u64,
  pub mysql_executor: E,
  pub phantom: PhantomData<&'c E>,
}

pub async fn upsert_user_daily_spend<'e, 'c: 'e, E>(
  args: UpsertUserDailySpendArgs<'e, 'c, E>,
) -> Result<(), sqlx::Error>
where
  E: 'e + Executor<'c, Database = MySql>,
{
  sqlx::query!(
    r#"
INSERT INTO user_daily_spends
SET
  user_token = ?,
  payments_namespace = ?,
  spend_date = ?,
  subscription_spend_usd_cents = ?,
  credits_spend_usd_cents = ?,
  gross_spend_usd_cents = ?,
  refund_usd_cents = ?,
  net_spend_usd_cents = ?,
  payment_count = ?,
  credits_granted = ?
ON DUPLICATE KEY UPDATE
  subscription_spend_usd_cents = VALUES(subscription_spend_usd_cents),
  credits_spend_usd_cents      = VALUES(credits_spend_usd_cents),
  gross_spend_usd_cents        = VALUES(gross_spend_usd_cents),
  refund_usd_cents             = VALUES(refund_usd_cents),
  net_spend_usd_cents          = VALUES(net_spend_usd_cents),
  payment_count                = VALUES(payment_count),
  credits_granted              = VALUES(credits_granted)
    "#,
    args.user_token.as_str(),
    args.payments_namespace.to_str(),
    args.spend_date,
    args.subscription_spend_usd_cents,
    args.credits_spend_usd_cents,
    args.gross_spend_usd_cents,
    args.refund_usd_cents,
    args.net_spend_usd_cents,
    args.payment_count,
    args.credits_granted,
  )
    .execute(args.mysql_executor)
    .await?;

  Ok(())
}
