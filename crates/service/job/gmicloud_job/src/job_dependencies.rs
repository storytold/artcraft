use cloud_storage::bucket_client::BucketClient;
use concurrency::relaxed_atomic_bool::RelaxedAtomicBool;
use gmicloud_client::creds::gmicloud_api_key::GmiCloudApiKey;
use jobs_common::job_stats::JobStats;
use server_environment::ServerEnvironment;
use sqlx::MySqlPool;

pub struct JobDependencies {
  pub mysql_pool: MySqlPool,

  /// Public GCS/S3 bucket for storing generated videos.
  pub public_bucket_client: BucketClient,

  /// API key for GmiCloud.
  pub gmicloud_api_key: GmiCloudApiKey,

  pub server_environment: ServerEnvironment,

  pub job_stats: JobStats,

  /// How long to sleep between poll iterations (milliseconds).
  pub poll_interval_millis: u64,

  /// Set to `true` from another thread to trigger graceful shutdown.
  pub application_shutdown: RelaxedAtomicBool,
}
