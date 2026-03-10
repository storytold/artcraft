use jobs_common::job_stats::JobStats;

#[derive(Clone)]
pub struct HttpServerSharedState {
  pub job_stats: JobStats,
  pub consecutive_failure_unhealthy_threshold: u64,
}
