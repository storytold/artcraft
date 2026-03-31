use jobs_common::job_stats::JobStats;
use pager::client::pager::Pager;

#[derive(Clone)]
pub struct HttpServerSharedState {
  pub job_stats: JobStats,
  pub consecutive_failure_unhealthy_threshold: u64,
  pub pager: Pager,
  pub hostname: String,
}
