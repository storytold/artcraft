-- noinspection SqlDialectInspectionForFile
-- noinspection SqlNoDataSourceInspectionForFile
-- noinspection SqlResolveForFile

-- NB: This is a manually squashed view of all the CREATE and ALTER statements,
-- with comments attached to the fields for centralized documentation.

-- Raw mirror of the Kinovi billing payments history (`billing.getPayments`),
-- one row per credit-pack purchase event on a Kinovi account. This is the
-- "what Kinovi says we bought" side of the spend dashboard; the actual cash
-- leaves later (we are invoiced in arrears, typically T30 — irrelevant to
-- this table, which records the purchase events themselves).
--
-- Populated by kinovi_reports_job every ~15 minutes: pages newest-first from
-- offset 0 and stops at the first page whose rows all already exist (by
-- uq_account_payment). The first run naturally walks the entire history
-- (~1k rows); no separate sync-state bookkeeping is needed.
CREATE TABLE kinovi_credits_purchases (
  -- Replication only. Rows are addressed by (kinovi_account,
  -- kinovi_payment_id); individual rows are never looked up publicly, so
  -- there is no token column.
  id BIGINT(20) UNSIGNED NOT NULL AUTO_INCREMENT,

  -- Which of our Kinovi accounts made this purchase. KinoviAccount enum:
  -- 'volcengine' / 'byteplus' / 'byteplus_ultra' (future accounts extend the
  -- enum; readers must tolerate unknown values).
  kinovi_account VARCHAR(32) NOT NULL,

  -- Kinovi's row id for this payment (their `id`, e.g. "31722"). Their API
  -- returns it as a string; kept verbatim. Dedup anchor with kinovi_account.
  kinovi_payment_id VARCHAR(64) NOT NULL,

  -- ========== MONEY / CREDITS ==========

  -- Purchase price in USD cents. Kinovi's API returns dollars (2159, 99.99);
  -- converted to cents on ingest (round to the nearest cent) so we never
  -- store floats. The standard bulk pack is 525,000 credits for 215,909
  -- cents ($2,159.09, ~243.16 credits/$1).
  amount_usd_cents BIGINT UNSIGNED NOT NULL,

  -- Kinovi credits granted by this purchase (e.g. 525,000).
  credits_earned BIGINT UNSIGNED NOT NULL,

  -- ========== TIMESTAMPS ==========

  -- When Kinovi recorded the purchase (their createdAt, UTC). Bin/aggregate
  -- on THIS, not created_at (which is when our job ingested the row).
  kinovi_created_at TIMESTAMP NOT NULL,

  -- Their updatedAt. Falls back to createdAt on ingest when missing or
  -- unparseable.
  kinovi_updated_at TIMESTAMP NOT NULL,

  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  -- ========== INDICES ==========
  PRIMARY KEY (id),
  -- Idempotency: one row per Kinovi payment per account.
  UNIQUE KEY uq_account_payment (kinovi_account, kinovi_payment_id),
  KEY idx_kinovi_created (kinovi_created_at),
  KEY idx_account_kinovi_created (kinovi_account, kinovi_created_at)

) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin;
