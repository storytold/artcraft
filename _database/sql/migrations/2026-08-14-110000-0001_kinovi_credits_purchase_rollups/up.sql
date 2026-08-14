-- noinspection SqlDialectInspectionForFile
-- noinspection SqlNoDataSourceInspectionForFile
-- noinspection SqlResolveForFile

-- Pre-aggregated rollups of kinovi_credits_purchases at every graphing
-- resolution, per Kinovi account. One row per (account, period_type,
-- period_start); the dashboard sums across accounts for the combined series
-- or plots them separately. Sparsely populated — no row for empty periods.
-- Derived from (and fully rebuildable from) kinovi_credits_purchases;
-- maintained by kinovi_reports_job after each ingest sweep.
CREATE TABLE kinovi_credits_purchase_rollups (
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

  -- ========== AGGREGATES (over kinovi_created_at within the bucket) ==========

  -- Number of pack purchases in the bucket.
  purchase_count INT UNSIGNED NOT NULL DEFAULT 0,

  -- Total purchase price, USD cents (what we owe Kinovi for these packs).
  amount_usd_cents BIGINT UNSIGNED NOT NULL DEFAULT 0,

  -- Total Kinovi credits granted by the purchases in the bucket.
  credits_earned BIGINT UNSIGNED NOT NULL DEFAULT 0,

  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  -- ========== INDICES ==========
  PRIMARY KEY (id),
  UNIQUE KEY uq_account_period (kinovi_account, period_type, period_start),
  -- "All accounts, one resolution, date range" — the dashboard's main query.
  KEY idx_period (period_type, period_start)

) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin;
