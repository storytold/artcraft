use std::marker::PhantomData;

use chrono::{DateTime, Utc};
use sqlx::{Executor, MySql};

use enums::by_table::user_spend_events::payment_event_type::PaymentEventType;
use enums::common::payments_namespace::PaymentsNamespace;
use tokens::tokens::users::UserToken;

/// A single spend event, trimmed to the fields the summary aggregation needs.
pub struct UserSpendEventRow {
  pub payment_occurred_at: DateTime<Utc>,
  pub amount_usd_cents: i64,
  pub event_type: PaymentEventType,
  pub maybe_credits_granted: Option<u32>,
}

pub struct ListUserSpendEventsForUserArgs<'e, 'c, E>
where
  E: 'e + Executor<'c, Database = MySql>,
{
  pub user_token: &'e UserToken,
  pub payments_namespace: PaymentsNamespace,
  pub mysql_executor: E,
  pub phantom: PhantomData<&'c E>,
}

pub async fn list_user_spend_events_for_user<'e, 'c: 'e, E>(
  args: ListUserSpendEventsForUserArgs<'e, 'c, E>,
) -> Result<Vec<UserSpendEventRow>, sqlx::Error>
where
  E: 'e + Executor<'c, Database = MySql>,
{
  let rows = sqlx::query_as!(
    UserSpendEventRow,
    r#"
SELECT
  payment_occurred_at AS `payment_occurred_at!: DateTime<Utc>`,
  amount_usd_cents,
  event_type AS `event_type!: PaymentEventType`,
  maybe_credits_granted AS `maybe_credits_granted: u32`
FROM user_spend_events
WHERE maybe_user_token = ?
  AND payments_namespace = ?
  AND is_production = TRUE
ORDER BY payment_occurred_at ASC
    "#,
    args.user_token.as_str(),
    args.payments_namespace.to_str(),
  )
    .fetch_all(args.mysql_executor)
    .await?;

  Ok(rows)
}
