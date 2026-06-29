-- noinspection SqlDialectInspectionForFile
-- noinspection SqlNoDataSourceInspectionForFile
-- noinspection SqlResolveForFile

-- Per-user, per-day spend rollup (L1). Net = gross - refunds. Subscription vs
-- credit-pack splits expose the revenue mix per day without touching the event
-- table. Sparsely populated -- no row for days with zero spend and zero refunds.
-- Derived from (and fully rebuildable from) user_spend_events.
CREATE TABLE user_daily_spends (
  -- Replication only.
  id BIGINT(20) UNSIGNED NOT NULL AUTO_INCREMENT,

  user_token VARCHAR(32) NOT NULL,
  payments_namespace VARCHAR(32) NOT NULL,

  -- Reporting day. Bins user_spend_events.payment_occurred_at in a FIXED tz
  -- (UTC). DATE, not TIMESTAMP.
  spend_date DATE NOT NULL,

  -- Revenue mix (subset of gross). Category totals can never go negative, so
  -- they're UNSIGNED.
  subscription_spend_usd_cents BIGINT UNSIGNED NOT NULL DEFAULT 0,
  credits_spend_usd_cents BIGINT UNSIGNED NOT NULL DEFAULT 0,

  gross_spend_usd_cents BIGINT UNSIGNED NOT NULL DEFAULT 0,   -- sum of positive amounts (UNSIGNED)
  refund_usd_cents BIGINT UNSIGNED NOT NULL DEFAULT 0,        -- refund/chargeback magnitude (UNSIGNED)
  -- NET is the ONE field here that must be SIGNED: a single day can net negative
  -- when refunds (often of an earlier day's purchase) exceed that day's purchases.
  net_spend_usd_cents BIGINT NOT NULL DEFAULT 0,             -- gross - refund (SIGNED)

  payment_count INT UNSIGNED NOT NULL DEFAULT 0,        -- # positive money events
  credits_granted BIGINT UNSIGNED NOT NULL DEFAULT 0,

  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  -- ========== INDICES ==========
  PRIMARY KEY (id),
  UNIQUE KEY uq_user_day (user_token, payments_namespace, spend_date),
  -- "Top spenders / spend in a date range": filter by date, then group by user.
  KEY idx_day_user_net (user_token, payments_namespace, spend_date, net_spend_usd_cents),
  KEY idx_user_day (user_token, spend_date)

) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin;
