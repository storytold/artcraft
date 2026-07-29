use std::marker::PhantomData;

use chrono::{DateTime, NaiveDate, Utc};
use sqlx::{Executor, MySql};

use enums::common::payments_namespace::PaymentsNamespace;
use tokens::tokens::users::UserToken;

/// One day of a user's spend activity (a `user_daily_spends` row).
pub struct UserDailySpendRow {
  pub payments_namespace: PaymentsNamespace,
  pub user_token: UserToken,
  pub spend_date: NaiveDate,
  pub subscription_spend_usd_cents: u64,
  pub credits_spend_usd_cents: u64,
  pub gross_spend_usd_cents: u64,
  pub refund_usd_cents: u64,
  pub net_spend_usd_cents: i64,
  pub payment_count: u32,
  pub credits_granted: u64,
  pub created_at: DateTime<Utc>,
  pub updated_at: DateTime<Utc>,
}

pub struct ListUserDailySpendsArgs<'e, 'c, E>
where
  E: 'e + Executor<'c, Database = MySql>,
{
  pub user_token: &'e UserToken,
  pub payments_namespace: PaymentsNamespace,
  pub limit: i64,
  pub offset: i64,
  pub mysql_executor: E,
  pub phantom: PhantomData<&'c E>,
}

/// A user's daily spend rows, most-recent payment date first.
pub async fn list_user_daily_spends<'e, 'c: 'e, E>(
  args: ListUserDailySpendsArgs<'e, 'c, E>,
) -> Result<Vec<UserDailySpendRow>, sqlx::Error>
where
  E: 'e + Executor<'c, Database = MySql>,
{
  let rows = sqlx::query_as!(
    UserDailySpendRow,
    r#"
SELECT
  payments_namespace AS `payments_namespace!: PaymentsNamespace`,
  user_token AS `user_token!: UserToken`,
  spend_date AS `spend_date!: NaiveDate`,
  subscription_spend_usd_cents,
  credits_spend_usd_cents,
  gross_spend_usd_cents,
  refund_usd_cents,
  net_spend_usd_cents,
  payment_count,
  credits_granted,
  created_at AS `created_at: DateTime<Utc>`,
  updated_at AS `updated_at: DateTime<Utc>`
FROM user_daily_spends
WHERE user_token = ?
  AND payments_namespace = ?
ORDER BY spend_date DESC
LIMIT ? OFFSET ?
    "#,
    args.user_token.as_str(),
    args.payments_namespace.to_str(),
    args.limit,
    args.offset,
  )
    .fetch_all(args.mysql_executor)
    .await?;

  Ok(rows)
}
