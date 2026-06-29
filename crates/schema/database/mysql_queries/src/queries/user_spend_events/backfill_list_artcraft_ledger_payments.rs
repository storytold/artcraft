use std::marker::PhantomData;

use chrono::{DateTime, Utc};
use sqlx::{Executor, MySql};

use tokens::tokens::users::UserToken;
use tokens::tokens::wallet_ledger_entries::WalletLedgerEntryToken;

/// One ArtCraft credit-from-payment ledger entry, used to ENRICH a Stripe-
/// enumerated payment during backfill (Stripe is the authoritative payment list,
/// not this). Keyed by `stripe_object_id` (`pi_…` for credit packs, `in_…` for
/// subscription invoices), which equals the spend-event dedup `source_object_id`.
pub struct LedgerPaymentRef {
  /// `wallet_ledger_entries.maybe_entity_ref` — the Stripe payment_intent /
  /// invoice id. Always present (the query filters to `pi_`/`in_`).
  pub stripe_object_id: String,

  /// `credit_banked` (credit pack) or `credit_monthly` (subscription).
  pub entry_type: String,

  /// The ledger entry — becomes `user_spend_events.maybe_wallet_ledger_entry_token`.
  pub ledger_token: WalletLedgerEntryToken,

  /// Wallet owner — becomes `user_spend_events.maybe_user_token`.
  pub owner_user_token: UserToken,

  /// Credits actually granted — becomes `user_spend_events.maybe_credits_granted`.
  pub credits_delta: i32,

  /// When we credited the wallet (≈ settlement; spend events still bin on the
  /// Stripe object's own timestamp).
  pub created_at: DateTime<Utc>,
}

pub struct BackfillListLedgerPaymentsArgs<'c, E>
where
  E: Executor<'c, Database = MySql>,
{
  /// Only entries at/after this instant (the payments start date, ~Feb).
  pub since: DateTime<Utc>,
  pub mysql_executor: E,
  pub phantom: PhantomData<&'c E>,
}

/// Load every ArtCraft payment-backed credit ledger entry since `since`, for the
/// backfill's in-memory enrichment map. ArtCraft-only via `wallet_namespace`
/// (the ledger has no FakeYou rows, but we filter defensively). Refund/staff/
/// deduct/create entries and non-Stripe refs are excluded.
pub async fn backfill_list_artcraft_ledger_payments<'c, E>(
  args: BackfillListLedgerPaymentsArgs<'c, E>,
) -> Result<Vec<LedgerPaymentRef>, sqlx::Error>
where
  E: Executor<'c, Database = MySql>,
{
  let rows = sqlx::query_as!(
    LedgerPaymentRef,
    r#"
SELECT
  wle.maybe_entity_ref AS `stripe_object_id!`,
  wle.entry_type       AS `entry_type!`,
  wle.token            AS `ledger_token!: WalletLedgerEntryToken`,
  w.owner_user_token   AS `owner_user_token!: UserToken`,
  wle.credits_delta    AS `credits_delta!`,
  wle.created_at        AS `created_at!: DateTime<Utc>`
FROM wallet_ledger_entries wle
JOIN wallets w ON w.token = wle.wallet_token
WHERE w.wallet_namespace = 'artcraft'
  AND wle.entry_type IN ('credit_banked', 'credit_monthly')
  AND wle.created_at >= ?
  AND (wle.maybe_entity_ref LIKE 'pi\_%' OR wle.maybe_entity_ref LIKE 'in\_%')
    "#,
    args.since,
  )
    .fetch_all(args.mysql_executor)
    .await?;

  Ok(rows)
}
