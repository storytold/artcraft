-- noinspection SqlDialectInspectionForFile
-- noinspection SqlNoDataSourceInspectionForFile
-- noinspection SqlResolveForFile

-- Per-user spend summary (L2). Lifetime/recency facts are event-maintained (they
-- only grow); sliding windows and weekly-rhythm metrics are job-maintained (they
-- shift even on days a user doesn't pay). Powers churn / dip / re-engagement
-- dashboards in O(1). Derived from (and fully rebuildable from) user_spend_events
-- and user_daily_spends.
CREATE TABLE user_spend_summaries (
  -- Replication only.
  id BIGINT(20) UNSIGNED NOT NULL AUTO_INCREMENT,

  payments_namespace VARCHAR(32) NOT NULL,
  user_token VARCHAR(32) NOT NULL,

  -- ===== Lifetime (event-maintained) =====
  -- Gross / category / refund totals are UNSIGNED. Lifetime net is UNSIGNED too:
  -- over a lifetime you can never refund more than was paid.
  lifetime_gross_spend_usd_cents BIGINT UNSIGNED NOT NULL DEFAULT 0,
  lifetime_subscription_spend_usd_cents BIGINT UNSIGNED NOT NULL DEFAULT 0,  -- revenue mix split
  lifetime_credits_spend_usd_cents BIGINT UNSIGNED NOT NULL DEFAULT 0,       -- revenue mix split
  lifetime_refund_usd_cents BIGINT UNSIGNED NOT NULL DEFAULT 0,
  lifetime_net_spend_usd_cents BIGINT UNSIGNED NOT NULL DEFAULT 0,           -- gross - refund
  -- Event COUNTS (not money): number of payment events vs refund/chargeback
  -- events over the user's lifetime. Both event-maintained.
  lifetime_payment_count INT UNSIGNED NOT NULL DEFAULT 0,   -- # of positive money events
  lifetime_refund_count INT UNSIGNED NOT NULL DEFAULT 0,    -- # of refund/chargeback events
  first_payment_at TIMESTAMP NULL DEFAULT NULL,
  first_spend_usd_cents BIGINT UNSIGNED NOT NULL DEFAULT 0,   -- amount of the first payment
  last_payment_at TIMESTAMP NULL DEFAULT NULL,
  last_spend_usd_cents BIGINT UNSIGNED NOT NULL DEFAULT 0,   -- amount of the most recent payment
  days_since_first_payment INT UNSIGNED DEFAULT NULL,         -- job-refreshed
  days_since_last_payment INT UNSIGNED DEFAULT NULL,         -- job-refreshed

  -- ===== Sliding NET spend windows -- SIGNED, a window can net negative
  --       (job-refreshed from user_daily_spends) =====
  -- "prev" = the equally-sized window immediately before, for WoW/MoM deltas.
  net_spend_7d_usd_cents BIGINT NOT NULL DEFAULT 0,
  net_spend_prev_7d_usd_cents BIGINT NOT NULL DEFAULT 0,
  net_spend_14d_usd_cents BIGINT NOT NULL DEFAULT 0,             -- bi-weekly
  net_spend_prev_14d_usd_cents BIGINT NOT NULL DEFAULT 0,
  net_spend_30d_usd_cents BIGINT NOT NULL DEFAULT 0,
  net_spend_prev_30d_usd_cents BIGINT NOT NULL DEFAULT 0,
  net_spend_60d_usd_cents BIGINT NOT NULL DEFAULT 0,
  net_spend_90d_usd_cents BIGINT NOT NULL DEFAULT 0,
  net_spend_this_year_usd_cents BIGINT NOT NULL DEFAULT 0,

  -- ===== Weekly cadence / rhythm (job-refreshed) -- for the sales team =====
  -- A "week" is Mon-Sun UTC. These let sales spot users breaking their habit.
  -- Per-user weekly baselines at two horizons: 4w is responsive (recent norm),
  -- 12w is stable (established norm). 4w well below 12w is itself a cooling-off
  -- signal. Mean weekly NET spend over the trailing window (calendar weeks,
  -- zero-spend weeks included). SIGNED, like the window nets.
  avg_weekly_net_spend_4w_usd_cents BIGINT NOT NULL DEFAULT 0,
  avg_weekly_net_spend_12w_usd_cents BIGINT NOT NULL DEFAULT 0,
  -- How many of the last N calendar weeks had any net spend -- a regularity
  -- measure at several horizons.
  active_weeks_in_last_4 TINYINT UNSIGNED NOT NULL DEFAULT 0,   -- 0..4
  active_weeks_in_last_8 TINYINT UNSIGNED NOT NULL DEFAULT 0,   -- 0..8
  active_weeks_in_last_12 TINYINT UNSIGNED NOT NULL DEFAULT 0,  -- 0..12
  active_weeks_in_last_24 TINYINT UNSIGNED NOT NULL DEFAULT 0,  -- 0..24
  active_weeks_in_last_52 TINYINT UNSIGNED NOT NULL DEFAULT 0,  -- 0..52
  consecutive_active_weeks INT UNSIGNED NOT NULL DEFAULT 0,     -- current "streak"
  consecutive_inactive_weeks INT UNSIGNED NOT NULL DEFAULT 0,   -- current "dip" length
  -- Recency in weeks. Subsumes the entire "is_active_spender_last_N_weeks"
  -- family: "active in the last N weeks" == (weeks_since_last_spend < N). So we
  -- intentionally store NO is_active_* booleans (redundant + poor index
  -- selectivity); we index this field instead and range-query any N. NULL = never spent.
  weeks_since_last_spend INT UNSIGNED DEFAULT NULL,

  -- ===== Flags =====
  is_active_subscriber BOOLEAN NOT NULL DEFAULT FALSE,   -- from user_subscriptions
  maybe_subscription_interval VARCHAR(16) DEFAULT NULL,  -- 'month' / 'year' (annual plans behave differently)
  -- Optional precomputed re-engagement priority (job-set).
  maybe_reengagement_score INT UNSIGNED DEFAULT NULL,

  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  -- ========== INDICES ==========
  PRIMARY KEY (id),
  UNIQUE KEY uq_user (payments_namespace, user_token),
  KEY idx_lifetime (payments_namespace, lifetime_net_spend_usd_cents),
  KEY idx_last_payment_at (payments_namespace, last_payment_at),
  KEY idx_first_payment_at (payments_namespace, first_payment_at),
  KEY idx_spend_7d (payments_namespace, net_spend_7d_usd_cents),
  KEY idx_spend_30d (payments_namespace, net_spend_30d_usd_cents),
  KEY idx_reengagement (payments_namespace, maybe_reengagement_score),
  -- Sort / range-filter by recency. idx_weeks_since_last_spend also powers every
  -- "active in the last N weeks" query (weeks_since_last_spend < N).
  KEY idx_weeks_since_last_spend (payments_namespace, weeks_since_last_spend),
  KEY idx_days_since_last_payment (payments_namespace, days_since_last_payment)

) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin;
