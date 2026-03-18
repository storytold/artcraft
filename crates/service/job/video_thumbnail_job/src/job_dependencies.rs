use std::path::PathBuf;

use cloud_storage::bucket_client::BucketClient;
use concurrency::relaxed_atomic_bool::RelaxedAtomicBool;
use jobs_common::job_stats::JobStats;
use server_environment::ServerEnvironment;
use sqlx::MySqlPool;

/// Optional sharding configuration for distributing work across parallel job instances.
pub struct ShardInfo {
  pub number_of_shards: u8,
  pub shard_index: u8,
}

pub struct JobDependencies {
  pub mysql_pool: MySqlPool,

  /// Public GCS/S3 bucket for downloading source videos and uploading generated thumbnails.
  pub public_bucket_client: BucketClient,

  pub server_environment: ServerEnvironment,

  pub job_stats: JobStats,

  /// How long to sleep between poll iterations when there is no work (milliseconds).
  pub poll_interval_millis: u64,

  /// Minimum delay between successive database queries within a single poll cycle (milliseconds).
  pub query_delay_millis: u64,

  /// How long to wait after a query failure before retrying (milliseconds).
  pub query_failure_retry_delay_millis: u64,

  /// Override for the lookback window (hours). `None` uses the query default.
  pub custom_max_lookback_hours: Option<i32>,

  /// Override for the query page size. `None` uses the query default.
  pub custom_page_size: Option<i64>,

  /// Root directory for temporary files (video downloads, thumbnail intermediates).
  pub temp_dir: PathBuf,

  /// If present, only process media files where `id % number_of_shards == shard_index`.
  pub shard_info: Option<ShardInfo>,

  /// Set to `true` from another thread to trigger graceful shutdown.
  pub application_shutdown: RelaxedAtomicBool,
}
