-- noinspection SqlDialectInspectionForFile
-- noinspection SqlNoDataSourceInspectionForFile
-- noinspection SqlResolveForFile

-- Rollups of Kinovi order costs (credits consumed by our generations, and
-- credits refunded back) at every graphing resolution, per Kinovi account.
-- One row per (account, period_type, period_start); sparsely populated.
--
-- THERE IS NO RAW TABLE UNDERNEATH THIS — quarter-hour buckets are computed
-- directly from the Kinovi credits ledger API (`credits.getCreditHistory`)
-- by kinovi_reports_job, and the coarser resolutions are derived by summing
-- quarter-hours. The job's sweep (every ~15 minutes):
--
--   1. Page the ledger newest-first back to max(2h lookback, the newest
--      existing quarter-hour bucket) — the second bound self-heals outages
--      of any length.
--   2. Bucket entries by their OWN timestamps into quarter hours, counting
--      only consumption and refund entries (grants are the purchases
--      table's business).
--   3. RECOMPUTE-AND-REPLACE each covered bucket (never increment), which
--      makes overlapping sweeps idempotent without storing raw entries.
--   4. Re-derive the covering hour/day/week/month buckets from quarter
--      hours.
--
-- Refunds land in the bucket where the REFUND was issued, not where the
-- original order was billed (the ledger is append-only, so a late refund is
-- always a *new* entry inside the sweep window — no deep re-consumption is
-- ever needed). net_credits_consumed can therefore go negative in a
-- refund-heavy bucket.
--
-- All figures are in KINOVI CREDITS. USD conversion happens at read time
-- (credits ÷ the negotiated bulk rate, currently 243.16 credits/$1) so a
-- future rate change never requires rewriting history; the purchases rollup
-- carries the actual dollars.
CREATE TABLE kinovi_order_rollups (
  -- Replication only.
  id BIGINT(20) UNSIGNED NOT NULL AUTO_INCREMENT,

  -- KinoviAccount enum: 'volcengine' / 'byteplus' / 'byteplus_ultra'.
  kinovi_account VARCHAR(32) NOT NULL,

  -- RollupPeriodType enum — the graphing resolution of this row:
  --   'quarter_hour' -- 15-minute buckets (:00, :15, :30, :45)
  --   'hour'
  --   'day'
  --   'week'         -- ISO weeks, Monday 00:00 UTC
  --   'month'        -- 1st of the month, 00:00 UTC
  period_type VARCHAR(16) NOT NULL,

  -- Bucket start, UTC. All period types normalize into this one column
  -- (a day row is midnight UTC, a month row is the 1st at midnight, etc.),
  -- so one query shape serves every graph resolution.
  period_start TIMESTAMP NOT NULL,

  -- ========== AGGREGATES ==========

  -- # of consumption entries (~generation orders billed) in the bucket.
  order_count INT UNSIGNED NOT NULL DEFAULT 0,

  -- # of refund entries in the bucket.
  refund_count INT UNSIGNED NOT NULL DEFAULT 0,

  -- Credits consumed by generations (magnitude of negative consumption
  -- deltas).
  credits_consumed BIGINT UNSIGNED NOT NULL DEFAULT 0,

  -- Credits refunded back (magnitude of positive refund deltas).
  credits_refunded BIGINT UNSIGNED NOT NULL DEFAULT 0,

  -- consumed − refunded (SIGNED — refunds often net against consumption
  -- from an EARLIER bucket). This is the cost line the dashboard graphs.
  net_credits_consumed BIGINT NOT NULL DEFAULT 0,

  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  -- ========== INDICES ==========
  PRIMARY KEY (id),
  UNIQUE KEY uq_account_period (kinovi_account, period_type, period_start),
  -- "All accounts, one resolution, date range" — the dashboard's main query.
  KEY idx_period (period_type, period_start)

) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin;
