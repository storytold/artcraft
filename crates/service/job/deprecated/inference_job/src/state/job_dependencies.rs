#![forbid(unreachable_patterns)]
#![forbid(unused_imports)]
#![forbid(unused_mut)]
#![forbid(unused_variables)]

use std::path::PathBuf;

use r2d2_redis::r2d2;
use r2d2_redis::RedisConnectionManager;
use sqlx::MySqlPool;

use bootstrap::bootstrap::ContainerEnvironment;
use cloud_storage::bucket_client::BucketClient;
use bucket_paths::legacy::old_bespoke_paths::bucket_path_unifier::BucketPathUnifier;
use concurrency::relaxed_atomic_bool::RelaxedAtomicBool;
use jobs_common::job_progress_reporter::job_progress_reporter::JobProgressReporterBuilder;
use jobs_common::job_stats::JobStats;
use jobs_common::semi_persistent_cache_dir::SemiPersistentCacheDir;
use memory_caching::multi_item_ttl_cache::MultiItemTtlCache;
use memory_caching::ttl_key_counter::TtlKeyCounter;
use migration::text_to_speech::get_tts_model_for_run_inference_migration::TtsModelForRunInferenceMigrationWrapper;
use migration::voice_conversion::query_vc_model_for_migration::VcModel;
use mysql_queries::common_inputs::container_environment_arg::ContainerEnvironmentArg;
use mysql_queries::mediators::firehose_publisher::FirehosePublisher;

use crate::state::job_specific_dependencies::JobSpecificDependencies;
use crate::state::scoped_job_type_execution::ScopedJobTypeExecution;
use crate::state::scoped_model_type_execution::ScopedModelTypeExecution;
use crate::util::filesystem::scoped_temp_dir_creator::ScopedTempDirCreator;
use crate::util::instrumentation::JobInstruments;
use crate::util::model_weights_cache::model_weights_cache_directory::ModelWeightsCacheDirectory;

pub struct JobDependencies {
  /// Database dependencies.
  pub db: DatabaseDependencies,

  /// Filesystem info and utils.
  pub fs: FileSystemDetails,

  /// Various cloud bucket tools.
  pub buckets: BucketDependencies,

  /// Various clients; HTTP, 3rd party, etc.
  pub clients: ClientDependencies,

  /// Job controls, stats, etc.
  pub job: JobSystemDependencies,

  /// otel instruments
  pub job_instruments: JobInstruments,
}

pub struct JobSystemDependencies {
  pub system: JobSystemControls,
  pub info: JobInstanceInfo,

  /// Specific dependencies for the various job types.
  /// They're only loaded if that type of job is configured to run.
  /// (See "scoped execution")
  pub job_specific_dependencies: JobSpecificDependencies,
}

pub struct JobSystemControls {
  /// The application should only run jobs associated with these types of models.
  /// This is provided at job start.
  pub scoped_model_type_execution: ScopedModelTypeExecution,

  /// The application should only run on these types of jobs.
  /// This is provided at job start.
  pub scoped_job_type_execution: ScopedJobTypeExecution,

  // Allow for models not to exist on the filesystem. All jobs will execute when first tried
  // regardless of whether their models were previously downloaded.
  pub always_allow_cold_filesystem_cache: bool,

  // How many times to skip jobs (on cold filesystem cache) before proceeding with execution.
  pub cold_filesystem_cache_starvation_threshold: u64,

  // Sleep between batches
  pub job_batch_wait_millis: u64,

  // Max job attempts before failure.
  pub job_max_attempts: u16,

  // Number of jobs to dequeue at once.
  pub job_batch_size: u32,

  // How long to wait between log lines
  pub no_op_logger_millis: u64,

  // Maximum number of synthesizer models to hold in memory.
  pub sidecar_max_synthesizer_models: usize,

  // Typically we'll sort jobs by priority. Occasionally we introduce a chance for low
  // priority jobs to run in the order they were enqueued.
  // If this is set to "0", we no longer consider priority
  pub low_priority_starvation_prevention_every_nth: usize,

  // A worker can be configured to only run jobs of a certain priority.
  // This finds jobs of equal or greater priority.
  pub maybe_minimum_priority: Option<u8>,

  // The application can be shut down from another thread.
  // Checking this will determine if the application needs to exit (true = exit).
  pub application_shutdown: RelaxedAtomicBool,

  // Debug workers only process special debug requests. They're silent otherwise.
  // Non-debug workers ignore debug requests. This is so we can deploy special code
  // to debug nodes (typically just one, perhaps even ephemerally).
  pub is_debug_worker: bool,
}

pub struct JobInstanceInfo {
  pub job_stats: JobStats,

  // In-process cache of database lookup records, etc.
  pub caches: JobCaches,

  pub container: ContainerEnvironment,
  pub container_db: ContainerEnvironmentArg, // Same info, but for database.

}

pub struct DatabaseDependencies {
  pub mysql_pool: MySqlPool,

  // TODO(2023-01-11): We don't always connect to a Redis
  //  Typically this is for job status reporting, but we might also report on when users leave the
  //  site to proactively kill their inference jobs and save on worker quota.
  //  On local dev we probably don't care about Redis at all, and on on-prem workers, we cannot
  //  connect to production Redis easily (requires lots of setup - ghosttunnel or something + IP rules)
  pub maybe_redis_pool: Option<r2d2::Pool<RedisConnectionManager>>,

  pub maybe_keepalive_redis_pool: Option<r2d2::Pool<RedisConnectionManager>>,
}

pub struct BucketDependencies {
  pub private_bucket_client: BucketClient,
  pub public_bucket_client: BucketClient,
  pub auto_gc_bucket_client: BucketClient,
  pub bucket_path_unifier: BucketPathUnifier,
}

pub struct ClientDependencies {
  pub job_progress_reporter: Box<dyn JobProgressReporterBuilder>,

  pub firehose_publisher: FirehosePublisher,
}

pub struct FileSystemDetails {
  /// If the pause file is set and exists on the filesystem,
  /// the job will pause until the file stops existing.
  /// Good for live debugging of production k8s clusters without
  /// redeploying.
  pub maybe_pause_file: Option<PathBuf>,

  /// Temporary directory for storing downloads
  /// Creates temp directories for scratch files
  pub scoped_temp_dir_creator_for_short_lived_downloads: ScopedTempDirCreator,

  /// Temporary directory for storing downloads
  /// (In prod, typically model files from GCS / NFS PVC mount)
  pub scoped_temp_dir_creator_for_long_lived_downloads: ScopedTempDirCreator,

  /// Temporary directory for storing work
  /// (In prod, typically python inference outputs / emptyDir mount)
  pub scoped_temp_dir_creator_for_work: ScopedTempDirCreator,

  /// Organizes downloaded files
  /// Directory to store long-term downloads (models)
  /// (In prod, typically model files from GCS / NFS PVC mount)
  pub semi_persistent_cache: SemiPersistentCacheDir,

  /// The new cache scheme for model weights.
  /// This should replace `semi_persistent_cache` for new users.
  pub model_weights_cache_directory: ModelWeightsCacheDirectory,
}

// TODO: Move into the appropriate job-specific dependencies object.
pub struct JobCaches {
  pub tts_model_record_cache: MultiItemTtlCache<String, TtsModelForRunInferenceMigrationWrapper>,
  pub vc_model_record_cache: MultiItemTtlCache<String, VcModel>,

  /// Skip processing models if they're not on the filesystem.
  /// If the counter elapses a delta, proceed with calculation.
  pub model_cache_counter: TtlKeyCounter,
}
