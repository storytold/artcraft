use cloud_storage::bucket_client::BucketClient;
use concurrency::relaxed_atomic_bool::RelaxedAtomicBool;
use gmicloud_client::creds::gmicloud_api_key::GmiCloudApiKey;
use jobs_common::job_stats::JobStats;
use pager::client::pager::Pager;
use server_environment::ServerEnvironment;
use sqlx::MySqlPool;

pub struct JobDependencies {
  pub mysql_pool: MySqlPool,

  /// Public GCS/S3 bucket for storing generated videos.
  pub public_bucket_client: BucketClient,

  /// API key for GmiCloud.
  pub gmicloud_api_key: GmiCloudApiKey,

  pub server_environment: ServerEnvironment,

  pub pager: Pager,

  pub job_stats: JobStats,

  /// How long to sleep after a successful poll iteration (milliseconds).
  pub poll_interval_success_millis: u64,

  /// How long to sleep after a failed poll iteration (milliseconds).
  pub poll_interval_failure_millis: u64,

  /// Set to `true` from another thread to trigger graceful shutdown.
  pub application_shutdown: RelaxedAtomicBool,
}
