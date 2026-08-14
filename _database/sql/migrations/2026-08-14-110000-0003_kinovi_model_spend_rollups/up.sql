-- noinspection SqlDialectInspectionForFile
-- noinspection SqlNoDataSourceInspectionForFile
-- noinspection SqlResolveForFile

-- Per-model / per-variant rollups of Kinovi order costs at every graphing
-- resolution, sourced ENTIRELY FROM KINOVI'S SIDE (`userOrder.getOrders`) —
-- deliberately NOT from our own generic_inference_jobs, so this remains an
-- independent check on our recorded costs. One row per (account, model,
-- resolution, has_video_reference, period_type, period_start); sparsely
-- populated.
--
-- THERE IS NO RAW ORDERS TABLE UNDERNEATH THIS — like kinovi_order_rollups,
-- buckets are recomputed directly from the API by kinovi_reports_job:
--
--   1. Cursor-page getOrders newest-first back to max(2h lookback, the
--      newest existing bucket) — orders settle (PENDING/PROCESSING ->
--      COMPLETED/FAILED) within minutes, so the lookback re-sweep captures
--      late settlement; the second bound self-heals outages.
--   2. Bucket orders by THEIR createdAt into quarter hours, keyed by the
--      dimensions below (taken from the order's own `params`).
--   3. RECOMPUTE-AND-REPLACE covered buckets (never increment) for
--      idempotency, then re-derive hour/day/week/month.
--
-- Costs count COMPLETED orders' totalCredits (failed orders are refunded by
-- Kinovi ~in full). Rare late policy refunds do NOT appear in the orders
-- API (the order stays COMPLETED), so this table can slightly overstate net
-- cost; kinovi_order_rollups (ledger-based, refund-complete) remains the
-- authoritative TOTAL — the two cross-check each other.
--
-- All figures are in KINOVI CREDITS; USD conversion happens at read time.
CREATE TABLE kinovi_model_spend_rollups (
  -- Replication only. Rows are addressed by the composite unique key below;
  -- individual rows are never looked up publicly, so there is no token.
  id BIGINT(20) UNSIGNED NOT NULL AUTO_INCREMENT,

  -- KinoviAccount enum: 'volcengine' / 'byteplus' / 'byteplus_ultra'.
  kinovi_account VARCHAR(32) NOT NULL,

  -- ========== MODEL / VARIANT DIMENSIONS (from the order's params) ==========

  -- Kinovi's own model identifier, verbatim (their `params.model`, e.g.
  -- 'seedance-20', 'seedance-25', 'midjourney-v8'; falls back to the
  -- order's toolId, else 'unknown'). Kinovi controls these values — mapped
  -- in code with an Unknown passthrough, never rewritten at ingest.
  kinovi_model VARCHAR(64) NOT NULL,

  -- Canonical encoding of every BILLING-AFFECTING dimension of the order
  -- within its model — which cell of the model's rate card it billed.
  -- Constructed by ONE canonical builder in code (deterministic, so equal
  -- configurations always collide into the same rollup row): lowercase
  -- 'key=value' / bare-flag segments, sorted, comma-joined, defaults
  -- omitted. Empty string = the model's base rate. Examples:
  --   ''                      -- base rate (e.g. audio model, no modifiers)
  --   'res=720p'              -- 720p, no surcharges
  --   'res=720p,vidref'       -- 720p with a reference video attached
  --   'quality=2'             -- Midjourney quality tier
  -- Future rate-affecting factors (audio generation, bitrate tiers, ...)
  -- become new segments — no schema change. Dimensions that DON'T affect
  -- the model's billing are deliberately excluded per model, so rows stay
  -- coarse where price is uniform.
  rate_card_key VARCHAR(128) NOT NULL,

  -- Denormalized convenience copy of the resolution segment of
  -- rate_card_key ('480p'/'720p'/'1080p'/'4k'; WxH forms like '1280x720'
  -- normalize to their p-label). NULL for models where resolution does not
  -- apply (audio) or the order carries none. NOT part of the unique key —
  -- rate_card_key is the identity; this exists for the common
  -- filter/group-by-resolution queries.
  maybe_resolution VARCHAR(32) DEFAULT NULL,

  -- ========== PERIOD ==========

  -- RollupPeriodType enum — the graphing resolution of this row:
  --   'quarter_hour' -- 15-minute buckets (:00, :15, :30, :45)
  --   'hour'
  --   'day'
  --   'week'         -- ISO weeks, Monday 00:00 UTC
  --   'month'        -- 1st of the month, 00:00 UTC
  period_type VARCHAR(16) NOT NULL,

  -- Bucket start, UTC (same normalization as the other rollup tables).
  period_start TIMESTAMP NOT NULL,

  -- ========== AGGREGATES (over order createdAt within the bucket) ==========

  -- All orders created in the bucket, settled or not. In-flight orders
  -- (PENDING/PROCESSING) count here and migrate into completed_count /
  -- failed_count as the lookback re-sweep observes them settling.
  order_count INT UNSIGNED NOT NULL DEFAULT 0,

  completed_count INT UNSIGNED NOT NULL DEFAULT 0,
  failed_count INT UNSIGNED NOT NULL DEFAULT 0,

  -- Sum of totalCredits over COMPLETED orders — the cost line the dashboard
  -- graphs per model/variant.
  credits_charged BIGINT UNSIGNED NOT NULL DEFAULT 0,

  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  -- ========== INDICES ==========
  PRIMARY KEY (id),
  UNIQUE KEY uq_cell_period (kinovi_account, kinovi_model, rate_card_key, period_type, period_start),
  -- "All models, date range" — the dashboard's main breakdown query
  -- (filter by period, group by model / rate_card_key / resolution).
  KEY idx_period (period_type, period_start),
  KEY idx_model_period (kinovi_model, period_type, period_start)

) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin;
