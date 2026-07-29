use std::marker::PhantomData;

use chrono::{DateTime, Utc};
use sqlx::{Executor, MySql};

use tokens::tokens::user_spend_events::UserSpendEventToken;
use tokens::tokens::users::UserToken;

/// A spend event joined (left) to its user's display info for the moderation list.
pub struct UserSpendEventListItem {
  pub token: UserSpendEventToken,
  pub payments_namespace: String,
  pub maybe_user_token: Option<UserToken>,
  pub maybe_username: Option<String>,
  pub maybe_display_name: Option<String>,
  pub maybe_email_gravatar_hash: Option<String>,
  pub event_type: String,
  pub amount_usd_cents: i64,
  pub maybe_credits_granted: Option<u32>,
  pub payment_source: String,
  pub maybe_source_object_id: Option<String>,
  pub maybe_stripe_invoice_id: Option<String>,
  pub maybe_stripe_payment_intent_id: Option<String>,
  pub maybe_stripe_charge_id: Option<String>,
  pub maybe_stripe_customer_id: Option<String>,
  pub is_production: bool,
  pub payment_occurred_at: DateTime<Utc>,
  pub created_at: DateTime<Utc>,
}

pub struct ListUserSpendEventsForModerationArgs<'e, 'c, E>
where
  E: 'e + Executor<'c, Database = MySql>,
{
  /// Optional namespace filter. `None` returns all namespaces.
  pub maybe_payments_namespace: Option<&'e str>,
  pub limit: i64,
  pub offset: i64,
  pub mysql_executor: E,
  pub phantom: PhantomData<&'c E>,
}

/// List spend events, most recent payment date first, with the spender's display info.
pub async fn list_user_spend_events_for_moderation<'e, 'c: 'e, E>(
  args: ListUserSpendEventsForModerationArgs<'e, 'c, E>,
) -> Result<Vec<UserSpendEventListItem>, sqlx::Error>
where
  E: 'e + Executor<'c, Database = MySql>,
{
  let rows = sqlx::query_as!(
    UserSpendEventListItem,
    r#"
SELECT
  e.token AS `token!: UserSpendEventToken`,
  e.payments_namespace AS `payments_namespace!`,
  e.maybe_user_token AS `maybe_user_token: UserToken`,
  u.username AS `maybe_username?`,
  u.display_name AS `maybe_display_name?`,
  u.email_gravatar_hash AS `maybe_email_gravatar_hash?`,
  e.event_type AS `event_type!`,
  e.amount_usd_cents,
  e.maybe_credits_granted AS `maybe_credits_granted: u32`,
  e.payment_source AS `payment_source!`,
  e.source_object_id AS `maybe_source_object_id`,
  e.maybe_stripe_invoice_id,
  e.maybe_stripe_payment_intent_id,
  e.maybe_stripe_charge_id,
  e.maybe_stripe_customer_id,
  e.is_production AS `is_production: bool`,
  e.payment_occurred_at AS `payment_occurred_at!: DateTime<Utc>`,
  e.created_at AS `created_at!: DateTime<Utc>`
FROM user_spend_events e
LEFT JOIN users u ON u.token = e.maybe_user_token
WHERE (? IS NULL OR e.payments_namespace = ?)
ORDER BY e.payment_occurred_at DESC, e.id DESC
LIMIT ? OFFSET ?
    "#,
    args.maybe_payments_namespace,
    args.maybe_payments_namespace,
    args.limit,
    args.offset,
  )
    .fetch_all(args.mysql_executor)
    .await?;

  Ok(rows)
}
