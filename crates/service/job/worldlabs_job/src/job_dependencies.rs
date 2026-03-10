use cloud_storage::bucket_client::BucketClient;
use concurrency::relaxed_atomic_bool::RelaxedAtomicBool;
use jobs_common::job_stats::JobStats;
use server_environment::ServerEnvironment;
use sqlx::MySqlPool;
use world_labs_api::credentials::world_labs_api_creds::WorldLabsApiCreds;

pub struct JobDependencies {
  pub mysql_pool: MySqlPool,

  /// Public GCS/S3 bucket for storing generated splats.
  pub public_bucket_client: BucketClient,

  /// API credentials for World Labs.
  pub worldlabs_creds: WorldLabsApiCreds,

  pub server_environment: ServerEnvironment,

  pub job_stats: JobStats,

  /// How long to sleep between poll iterations (milliseconds).
  pub poll_interval_millis: u64,

  /// Set to `true` from another thread to trigger graceful shutdown.
  pub application_shutdown: RelaxedAtomicBool,
}
