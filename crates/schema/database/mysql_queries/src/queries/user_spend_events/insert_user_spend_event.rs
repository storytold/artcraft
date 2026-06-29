use std::marker::PhantomData;

use chrono::{DateTime, Utc};
use sqlx::{Executor, MySql};

use enums::by_table::user_spend_events::payment_event_type::PaymentEventType;
use enums::by_table::user_spend_events::payment_source::PaymentSource;
use enums::common::payments_namespace::PaymentsNamespace;
use tokens::tokens::user_spend_events::UserSpendEventToken;
use tokens::tokens::user_subscriptions::UserSubscriptionToken;
use tokens::tokens::users::UserToken;
use tokens::tokens::wallet_ledger_entries::WalletLedgerEntryToken;

/// Arguments for [`insert_user_spend_event`].
///
/// Pass an already-open transaction or connection as `mysql_executor` (e.g.
/// `&mut *transaction`) so the spend-event row lands in the SAME transaction as
/// the wallet credit it accompanies. The function mints the
/// [`UserSpendEventToken`] itself.
pub struct InsertUserSpendEventArgs<'e, 'c, E>
where
  E: 'e + Executor<'c, Database = MySql>,
{
  pub payments_namespace: PaymentsNamespace,

  /// Who paid. `None` only when we genuinely can't attribute the money yet.
  pub maybe_user_token: Option<&'e UserToken>,

  pub event_type: PaymentEventType,

  /// Signed USD cents: positive for purchases, negative for refunds/chargebacks,
  /// zero for non-revenue events (e.g. annual monthly refills).
  pub amount_usd_cents: i64,

  /// Credits this payment granted, if any (matches the wallet credit).
  pub maybe_credits_granted: Option<u32>,

  /// The subscription this payment belongs to, if any.
  pub maybe_user_subscription_token: Option<&'e UserSubscriptionToken>,

  /// The wallet ledger entry this payment produced, if any. Ties a dollar event
  /// to its credit effect.
  pub maybe_wallet_ledger_entry_token: Option<&'e WalletLedgerEntryToken>,

  pub payment_source: PaymentSource,

  /// The dedup anchor: the Stripe object id (invoice / payment_intent / refund).
  /// For Stripe payments this is ALWAYS set — it's what makes a replayed webhook
  /// idempotent (see `uq_source_object` and the `ON DUPLICATE KEY UPDATE` below).
  /// `None` is only for manual/sourceless rows, which intentionally never dedup.
  pub maybe_source_object_id: Option<&'e str>,

  pub maybe_stripe_customer_id: Option<&'e str>,
  pub maybe_stripe_invoice_id: Option<&'e str>,
  pub maybe_stripe_payment_intent_id: Option<&'e str>,
  pub maybe_stripe_charge_id: Option<&'e str>,
  pub maybe_stripe_event_id: Option<&'e str>,

  /// Stripe livemode.
  pub is_production: bool,

  /// When the money actually moved (Stripe settlement time), NOT ingest time.
  pub payment_occurred_at: DateTime<Utc>,

  pub mysql_executor: E,
  pub phantom: PhantomData<&'c E>,
}

/// Insert one `user_spend_events` row, idempotently.
///
/// A replayed Stripe webhook collides on `uq_source_object (payment_source,
/// source_object_id)`; the `ON DUPLICATE KEY UPDATE token = token` makes that a
/// no-op, so a double delivery neither errors nor double-counts. (Manual rows
/// with a `NULL` source_object_id are exempt and always insert, since MySQL
/// treats each `NULL` in a unique index as distinct.)
///
/// NB: This uses the runtime `sqlx::query()` rather than the compile-time
/// `query!` macro because `user_spend_events` is a brand-new table that isn't in
/// the `.sqlx/` offline cache yet. Once the migration has been applied to a dev
/// DB and `cargo sqlx prepare` has been run, convert this to `query!`.
pub async fn insert_user_spend_event<'e, 'c: 'e, E>(
  args: InsertUserSpendEventArgs<'e, 'c, E>,
) -> Result<(), sqlx::Error>
where
  E: 'e + Executor<'c, Database = MySql>,
{
  let token = UserSpendEventToken::generate();

  sqlx::query(
    r#"
INSERT INTO user_spend_events
SET
  token = ?,
  payments_namespace = ?,
  maybe_user_token = ?,
  event_type = ?,
  amount_usd_cents = ?,
  maybe_credits_granted = ?,
  maybe_user_subscription_token = ?,
  maybe_wallet_ledger_entry_token = ?,
  payment_source = ?,
  source_object_id = ?,
  maybe_stripe_customer_id = ?,
  maybe_stripe_invoice_id = ?,
  maybe_stripe_payment_intent_id = ?,
  maybe_stripe_charge_id = ?,
  maybe_stripe_event_id = ?,
  is_production = ?,
  payment_occurred_at = ?
ON DUPLICATE KEY UPDATE token = token
    "#,
  )
    .bind(token.as_str())
    .bind(args.payments_namespace.to_str())
    .bind(args.maybe_user_token.map(|t| t.as_str()))
    .bind(args.event_type.to_str())
    .bind(args.amount_usd_cents)
    .bind(args.maybe_credits_granted)
    .bind(args.maybe_user_subscription_token.map(|t| t.as_str()))
    .bind(args.maybe_wallet_ledger_entry_token.map(|t| t.as_str()))
    .bind(args.payment_source.to_str())
    .bind(args.maybe_source_object_id)
    .bind(args.maybe_stripe_customer_id)
    .bind(args.maybe_stripe_invoice_id)
    .bind(args.maybe_stripe_payment_intent_id)
    .bind(args.maybe_stripe_charge_id)
    .bind(args.maybe_stripe_event_id)
    .bind(args.is_production)
    .bind(args.payment_occurred_at)
    .execute(args.mysql_executor)
    .await?;

  Ok(())
}
