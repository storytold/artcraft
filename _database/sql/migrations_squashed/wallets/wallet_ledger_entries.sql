-- noinspection SqlDialectInspectionForFile
-- noinspection SqlNoDataSourceInspectionForFile
-- noinspection SqlResolveForFile

CREATE TABLE wallet_ledger_entries (
  -- Not used for anything except replication.
  id BIGINT(20) NOT NULL AUTO_INCREMENT,

  -- Effective "primary key" (PUBLIC)
  token VARCHAR(32) NOT NULL,

  -- Which wallet this entry corresponds to.
  wallet_token VARCHAR(32) NOT NULL,

  -- The type of ledger entry this is.
  entry_type VARCHAR(16) NOT NULL,

  -- A record we can look up to attribute the credit or deduction against
  -- This could be an internal entity token (prompt_token, job token) or an
  -- external token (stripe event_id, stripe invoice.id, etc.)
  -- Length is VARCHAR(255) to accommodate Stripe IDs.
  maybe_entity_ref VARCHAR(255) DEFAULT NULL,

  -- Signed integer that shows the delta of credits for this event.
  -- This combines impacts to both banked_credits and monthly_credits.
  -- This is less authoritative than the before/after fields, but is useful
  credits_delta INTEGER NOT NULL DEFAULT 0,

  -- Balance of banked credits before the event.
  -- Max value unsigned: 4,294,967,295 (U32)
  banked_credits_before INTEGER UNSIGNED NOT NULL DEFAULT 0,

  -- Balance of banked credits after the event.
  banked_credits_after INTEGER UNSIGNED NOT NULL DEFAULT 0,

  -- Balance of monthly credits before the event.
  -- Max value unsigned: 4,294,967,295 (U32)
  monthly_credits_before INTEGER UNSIGNED NOT NULL DEFAULT 0,

  -- Balance of monthly credits after the event.
  monthly_credits_after INTEGER UNSIGNED NOT NULL DEFAULT 0,

  -- Whether this ledger entry has been refunded.
  is_refunded BOOLEAN NOT NULL DEFAULT FALSE,

  -- If this entry was refunded, this points to the refund ledger entry.
  maybe_linked_refund_ledger_token VARCHAR(32) DEFAULT NULL,

  -- ========== RECORD TIMESTAMPS ==========

  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

  -- ========== INDICES ==========
  PRIMARY KEY (id),
  UNIQUE KEY (token),
  KEY index_wallet_token (wallet_token)

) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin;
