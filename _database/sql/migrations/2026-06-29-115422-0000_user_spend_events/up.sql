-- noinspection SqlDialectInspectionForFile
-- noinspection SqlNoDataSourceInspectionForFile
-- noinspection SqlResolveForFile

-- Append-only ledger of real money movements (USD cents), one row per settled
-- event. Derived from settled Stripe webhooks (invoice.paid, payment_intent.
-- succeeded / checkout.session.completed, charge.refunded, charge.dispute.*),
-- NOT from every webhook. Idempotent via uq_source_object so retries never
-- double-count. We always work in USD via Stripe, so there are no currency or
-- fee columns.
CREATE TABLE user_spend_events (
  -- Replication only.
  id BIGINT(20) UNSIGNED NOT NULL AUTO_INCREMENT,

  -- Effective public primary key. Token prefix "spend_".
  token VARCHAR(32) NOT NULL,

  -- Multi-site segregation. Reuses the existing PaymentsNamespace enum.
  payments_namespace VARCHAR(32) NOT NULL,

  -- Who paid. Nullable so we can record money we can't yet attribute and
  -- backfill -- but expect this set ~always.
  maybe_user_token VARCHAR(32) DEFAULT NULL,

  -- PaymentEventType enum. Splits subscription vs credit-pack revenue:
  --  'subscription_initial'        -- first paid invoice of a new subscription
  --  'subscription_renewal'        -- recurring paid invoice (monthly, or annual once/yr)
  --  'subscription_proration_upgrade'   -- mid-cycle upgrade proration charge (positive)
  --  'subscription_proration_downgrade' -- mid-cycle downgrade proration credit (rare as a settled event)
  --  'credit_pack_purchase'        -- one-time credit pack (the ~10x-volume case)
  --  'refund'                      -- refund (amount negative)
  --  'chargeback'                  -- dispute/chargeback (amount negative)
  --  'manual_adjustment'           -- staff/console correction (payment_source = 'manual')
  --  'subscription_monthly_refill' -- OPTIONAL non-revenue event for annual-plan
  --                                   monthly credit refills (amount 0)
  event_type VARCHAR(32) NOT NULL,

  -- ========== MONEY ==========

  -- USD cents. SIGNED: refunds/chargebacks negative; refills are 0. BIGINT so
  -- downstream lifetime sums never overflow.
  amount_usd_cents BIGINT NOT NULL,

  -- For credit-pack purchases / subscription grants/refills: how many of OUR
  -- credits this granted. Lets us correlate dollars-in vs credits-granted vs
  -- credits-used. NULL for refunds/chargebacks.
  maybe_credits_granted INTEGER UNSIGNED DEFAULT NULL,

  -- ========== INTERNAL LINKAGE ==========

  -- The subscription this payment belongs to, if any (-> user_subscriptions.token).
  maybe_user_subscription_token VARCHAR(32) DEFAULT NULL,

  -- The credit-grant ledger entry this produced, if any
  -- (-> wallet_ledger_entries.token). Ties a dollar event to its credit effect.
  maybe_wallet_ledger_entry_token VARCHAR(32) DEFAULT NULL,

  -- ========== SOURCE / PROVIDER ==========

  -- PaymentSource enum: 'stripe' or 'manual'. (USD/Stripe only for the
  -- foreseeable future; 'manual' covers staff/console adjustments.)
  payment_source VARCHAR(16) NOT NULL,

  -- The authoritative object this row represents -- the dedup anchor. NULLABLE.
  -- For Stripe: invoice id (subscriptions), payment_intent id (one-time), or
  -- refund/dispute id (refunds). For payment_source='manual' (no provider
  -- object) leave it NULL. MySQL allows multiple NULLs in a unique index, so
  -- manual rows freely duplicate, while any present id is still deduped.
  source_object_id VARCHAR(255) DEFAULT NULL,

  -- Convenience copies for joins/forensics (255 + utf8mb4_bin for Stripe IDs).
  maybe_stripe_customer_id VARCHAR(255) DEFAULT NULL,
  maybe_stripe_invoice_id VARCHAR(255) DEFAULT NULL,
  maybe_stripe_payment_intent_id VARCHAR(255) DEFAULT NULL,
  maybe_stripe_charge_id VARCHAR(255) DEFAULT NULL,
  -- The webhook event that caused this row (provenance only).
  maybe_stripe_event_id VARCHAR(255) DEFAULT NULL,

  -- Stripe livemode. Keep test-mode money out of dashboards.
  is_production BOOLEAN NOT NULL DEFAULT FALSE,

  -- ========== TIMESTAMPS ==========

  -- When the money actually moved (Stripe settlement time). Bin/aggregate on
  -- THIS, not created_at (which is when we ingested the webhook).
  payment_occurred_at TIMESTAMP NOT NULL,

  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

  -- ========== INDICES ==========
  PRIMARY KEY (id),
  UNIQUE KEY (token),
  -- Idempotency: one row per settled object. NULL source_object_id rows (manual)
  -- are exempt -- MySQL treats each NULL in a unique index as distinct.
  UNIQUE KEY uq_source_object (payment_source, source_object_id),
  KEY idx_user_occurred (maybe_user_token, payment_occurred_at),
  KEY idx_occurred (payment_occurred_at),
  KEY idx_namespace_occurred (payments_namespace, payment_occurred_at),
  KEY idx_event_type (event_type),
  KEY idx_stripe_customer (maybe_stripe_customer_id),
  KEY idx_stripe_invoice (maybe_stripe_invoice_id)

) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin;
