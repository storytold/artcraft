use cloud_storage::bucket_client::BucketClient;
use concurrency::relaxed_atomic_bool::RelaxedAtomicBool;
use jobs_common::job_stats::JobStats;
use seedance2pro_client::creds::seedance2pro_session::Seedance2ProSession;
use server_environment::ServerEnvironment;
use sqlx::MySqlPool;

pub struct JobDependencies {
  pub mysql_pool: MySqlPool,

  /// Public GCS/S3 bucket for storing generated videos.
  pub public_bucket_client: BucketClient,

  /// Session credentials for polling seedance2-pro.com.
  pub seedance2pro_session: Seedance2ProSession,

  pub server_environment: ServerEnvironment,

  pub job_stats: JobStats,

  /// How long to sleep between poll iterations (milliseconds).
  pub poll_interval_millis: u64,

  /// Set to `true` from another thread to trigger graceful shutdown.
  pub application_shutdown: RelaxedAtomicBool,
}
