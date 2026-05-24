use std::sync::Arc;

use cloud_storage::bucket_client::BucketClient;
use concurrency::relaxed_atomic_bool::RelaxedAtomicBool;
use grok_api_client::creds::grok_api_key::GrokApiKey;
use jobs_common::job_stats::JobStats;
use pager::client::pager::Pager;
use server_environment::ServerEnvironment;
use sqlx::MySqlPool;
use tokio::sync::Notify;

#[derive(Clone)]
pub struct JobDependencies {
  pub mysql_pool: MySqlPool,

  /// Public GCS/S3 bucket for storing generated videos.
  pub public_bucket_client: BucketClient,

  /// API key for xAI's Imagine API.
  pub grok_api_key: GrokApiKey,

  pub server_environment: ServerEnvironment,

  pub pager: Pager,

  pub job_stats: JobStats,

  /// How long to sleep after a successful poll iteration (milliseconds).
  pub poll_interval_success_millis: u64,

  /// How long to sleep after a failed poll iteration (milliseconds).
  pub poll_interval_failure_millis: u64,

  /// How long to sleep between image_generation_job iterations (milliseconds).
  /// Stub-job for now — will be exercised once image generation is wired up.
  pub image_generation_poll_interval_millis: u64,

  /// Set to `true` from another thread to trigger graceful shutdown.
  pub application_shutdown: RelaxedAtomicBool,

  /// Notified when `application_shutdown` is set. Allows sleeping tasks
  /// to wake up immediately instead of waiting for the full sleep duration.
  pub shutdown_notify: Arc<Notify>,
}
