use std::sync::Arc;

use crate::kinovi_version::KinoviVersion;
use chrono::Duration;
use cloud_storage::bucket_client::BucketClient;
use concurrency::relaxed_atomic_bool::RelaxedAtomicBool;
use jobs_common::job_stats::JobStats;
use pager::client::pager::Pager;
use seedance2pro_client::creds::seedance2pro_session::Seedance2ProSession;
use server_environment::ServerEnvironment;
use sqlx::MySqlPool;
use tokio::sync::Notify;

#[derive(Clone)]
pub struct JobDependencies {
  pub mysql_pool: MySqlPool,

  /// Public GCS/S3 bucket for storing generated videos.
  pub public_bucket_client: BucketClient,

  /// Session credentials for polling seedance2-pro.com.
  pub seedance2pro_session: Seedance2ProSession,

  /// The kinovi account/version we poll
  pub kinovi_version: KinoviVersion,

  pub server_environment: ServerEnvironment,

  pub job_stats: JobStats,

  /// How long to sleep between poll iterations (milliseconds).
  pub poll_interval_millis: u64,

  /// If set, process jobs in batches of this many pages instead of
  /// exhausting all pages before processing. This prevents starvation
  /// when the order list is very long.
  pub maybe_pages_per_batch: Option<u32>,

  /// If set, stop paginating backwards through orders once we encounter
  /// an order older than this duration. This prevents endlessly scanning
  /// ancient orders that will never match a pending job.
  pub maybe_max_job_age: Option<Duration>,

  /// Maximum number of retries when a poll_orders request fails before
  /// alerting the pager and aborting the iteration.
  pub poll_max_retries: u32,

  /// Maximum delay in milliseconds between poll retries. The delay increases
  /// with each attempt up to this cap.
  pub poll_retry_max_delay_millis: u64,

  /// Page an alert when available Kinovi credits fall below this threshold.
  pub credits_alert_threshold: u64,

  /// Set to `true` from another thread to trigger graceful shutdown.
  pub application_shutdown: RelaxedAtomicBool,

  /// Notified when `application_shutdown` is set. Allows sleeping tasks
  /// to wake up immediately instead of waiting for the full sleep duration.
  pub shutdown_notify: Arc<Notify>,

  /// Pager client for sending alerts.
  pub pager: Pager,
}
