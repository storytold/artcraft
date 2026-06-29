# backfill-user-spend-events

Backfills the `user_spend_events` table from historical Stripe payments
(subscription creations, subscription renewals, and credit-pack purchases),
idempotently and safely.

## How it works

1. **Stripe is the authoritative payment list** (so we don't miss any payment,
   even ones the live webhook path failed to fulfill):
   - Paid **invoices** with `billing_reason` ∈ {`subscription_create`,
     `subscription_cycle`} → `subscription_initial` / `subscription_renewal`.
   - Succeeded one-off **PaymentIntents** (carry our `user_token` metadata, or
     match a ledger `credit_banked` entry) → `credit_pack_purchase`.
   Using the ArtCraft Stripe key means this is ArtCraft-only (FakeYou is a
   separate Stripe account), so there is no FakeYou contamination.
2. **The ArtCraft ledger (read pool) enriches** each payment with the granted
   credits (`maybe_credits_granted`) and the ledger-entry FK
   (`maybe_wallet_ledger_entry_token`), looked up by the Stripe object id.
3. **User attribution**, in order: (a) Stripe object metadata `user_token`,
   (b) ledger entry by Stripe id, (c) `user_stripe_customer_links` by customer.
   Payments that resolve to no user are **written to a CSV and NOT inserted**.
4. **Upsert** via `insert_user_spend_event`, keyed on
   `(payment_source, source_object_id)` — the same dedup key the webhook write
   path uses — so rows already written live are no-ops (no duplicates).

Read and write use **separate connections/credentials**, so you can dry-run
against the read replica → your local DB before running it live.

## Required env (loaded from `.env-db-backfill-secrets`)

```
MYSQL_READ_URL=mysql://USER:PASS@READ_REPLICA_HOST:PORT/storyteller
MYSQL_WRITE_URL=mysql://USER:PASS@TARGET_HOST:PORT/storyteller   # local for dry runs; prod when live
STRIPE_ARTCRAFT_SECRET_KEY=sk_live_or_test_for_the_ArtCraft_account
# optional: MYSQL_MAX_CONNECTIONS (default 20)
```

## Usage

```bash
# Safe dry run: enumerate + resolve + write the unattributed CSV, but DON'T write events.
cargo run -p db-backfill -- backfill-user-spend-events --since 2026-02-01 --dry-run --limit 50

# Real run into MYSQL_WRITE_URL (point it at LOCAL first to validate):
cargo run -p db-backfill -- backfill-user-spend-events --since 2026-02-01

# Go live by pointing MYSQL_WRITE_URL at production and re-running (idempotent).
```

Flags: `--since YYYY-MM-DD` (default `2026-02-01`), `--dry-run`,
`--unattributed-report PATH` (default `unattributed_payments.csv`),
`--limit N` (cap per type, for testing).

## Notes

- Prorations (`subscription_update` invoices) are intentionally skipped, matching
  the webhook write-path scope. The `PaymentEventType` enum has
  `subscription_proration_upgrade/downgrade` if you later want them.
- `maybe_stripe_event_id` is `NULL` for backfilled rows (no originating webhook).
- Because it's idempotent, it's safe to re-run after fixing user links to pick up
  previously-unattributed payments.
