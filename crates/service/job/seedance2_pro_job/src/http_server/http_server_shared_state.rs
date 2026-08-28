use std::time::Duration;

use jobs_common::job_stats::JobStats;
use pager::client::pager::Pager;

use crate::loop_heartbeats::LoopHeartbeats;

#[derive(Clone)]
pub struct HttpServerSharedState {
  pub job_stats: JobStats,
  pub consecutive_failure_unhealthy_threshold: u64,
  pub heartbeats: LoopHeartbeats,
  /// A loop whose last heartbeat is older than this makes the pod unhealthy.
  pub heartbeat_stale_threshold: Duration,
  pub pager: Pager,
  pub hostname: String,
}
