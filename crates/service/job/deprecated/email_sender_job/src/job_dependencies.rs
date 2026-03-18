use std::path::PathBuf;

use r2d2_redis::r2d2;
use r2d2_redis::RedisConnectionManager;
use sqlx::MySqlPool;

use bootstrap::bootstrap::ContainerEnvironment;
use concurrency::relaxed_atomic_bool::RelaxedAtomicBool;
use email_sender::smtp_email_sender::SmtpEmailSender;
use jobs_common::job_progress_reporter::job_progress_reporter::JobProgressReporterBuilder;
use jobs_common::job_stats::JobStats;
use mysql_queries::common_inputs::container_environment_arg::ContainerEnvironmentArg;
use server_environment::ServerEnvironment;

pub struct JobDependencies {
  /// Filesystem info and utils
  pub fs: FileSystemDetails,

  pub mysql_pool: MySqlPool,

  // TODO(2023-01-11): We don't always connect to a Redis
  //  Typically this is for job status reporting, but we might also report on when users leave the
  //  site to proactively kill their inference jobs and save on worker quota.
  //  On local dev we probably don't care about Redis at all, and on on-prem workers, we cannot
  //  connect to production Redis easily (requires lots of setup - ghosttunnel or something + IP rules)
  pub maybe_redis_pool: Option<r2d2::Pool<RedisConnectionManager>>,

  pub email_sender: SmtpEmailSender,

  pub server_environment: ServerEnvironment,

  pub maybe_keepalive_redis_pool: Option<r2d2::Pool<RedisConnectionManager>>,

  pub job_progress_reporter: Box<dyn JobProgressReporterBuilder>,

  pub job_stats: JobStats,

  pub worker_details: JobWorkerDetails,

  // Sleep between batches
  pub job_batch_wait_millis: u64,

  // Max job attempts before failure.
  pub job_max_attempts: u16,

  // Number of jobs to dequeue at once.
  pub job_batch_size: u32,

  // How long to wait between log lines
  pub no_op_logger_millis: u64,

  // Typically we'll sort jobs by priority. Occasionally we introduce a chance for low
  // priority jobs to run in the order they were enqueued.
  // If this is set to "0", we no longer consider priority
  pub low_priority_starvation_prevention_every_nth: usize,

  pub container: ContainerEnvironment,
  pub container_db: ContainerEnvironmentArg, // Same info, but for database.

  // The application can be shut down from another thread.
  // Checking this will determine if the application needs to exit (true = exit).
  pub application_shutdown: RelaxedAtomicBool,
}

pub struct FileSystemDetails {
  /// If the pause file is set and exists on the filesystem,
  /// the job will pause until the file stops existing.
  /// Good for live debugging of production k8s clusters without
  /// redeploying.
  pub maybe_pause_file: Option<PathBuf>,
}

pub struct JobWorkerDetails {
  // Debug workers only process special debug requests. They're silent otherwise.
  // Non-debug workers ignore debug requests. This is so we can deploy special code
  // to debug nodes (typically just one, perhaps even ephemerally).
  pub is_debug_worker: bool,
}
