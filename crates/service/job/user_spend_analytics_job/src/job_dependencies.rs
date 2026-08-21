use std::time::Duration;

use chrono::NaiveDate;
use concurrency::relaxed_atomic_bool::RelaxedAtomicBool;
use jobs_common::job_stats::JobStats;
use pager::client::pager::Pager;
use server_environment::ServerEnvironment;
use sqlx::MySqlPool;

/// Tunables for the `maybe_reengagement_score` (0..=1000). Higher = better
/// re-engagement target. See `crate::job::reengagement_score`.
pub struct ReengagementConfig {
  /// Lifetime net spend (USD) at which the value component saturates at its max.
  pub value_cap_dollars: f64,
  /// A user is only a re-engagement target once lapsed this many days.
  pub active_threshold_days: u32,
  /// Days after the lapse threshold over which the recency bonus decays to zero.
  pub decay_days: f64,
}

pub struct JobDependencies {
  pub mysql_pool: MySqlPool,
  pub server_environment: ServerEnvironment,
  pub job_stats: JobStats,

  /// How long to sleep after a full cycle (daily by default).
  pub sleep_between_cycles: Duration,
  /// Throttle between individual units of work (dates / users) so we don't hammer the DB.
  pub query_delay: Duration,
  /// How long to back off after an error before continuing to the next unit.
  pub error_recovery: Duration,

  /// Explicit daily-spends backfill start date (UTC). Takes precedence over `maybe_backfill_days`.
  pub maybe_backfill_start_date: Option<NaiveDate>,
  /// Look back this many days from today (UTC) if no explicit start date.
  pub maybe_backfill_days: Option<i64>,

  /// Page size when iterating users for the summaries backfill.
  pub summary_user_page_size: i64,

  pub reengagement: ReengagementConfig,

  pub application_shutdown: RelaxedAtomicBool,
  pub pager: Pager,
}
