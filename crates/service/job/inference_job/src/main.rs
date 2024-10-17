// Never allow these
#![forbid(private_bounds)]
#![forbid(private_interfaces)]
#![forbid(unused_must_use)] // NB: It's unsafe to not close/check some things

// Okay to toggle
//#![forbid(unreachable_patterns)]
//#![forbid(unused_imports)]
//#![forbid(unused_mut)]
//#![forbid(unused_variables)]

// Always allow
#![allow(dead_code)]
#![allow(non_snake_case)]

// Strict AF
//#![forbid(warnings)]

#[macro_use] extern crate serde_derive;

use std::path::PathBuf;
use std::time::Duration;

use log::{info, warn};
use r2d2_redis::r2d2;
use r2d2_redis::RedisConnectionManager;
use sqlx::mysql::MySqlPoolOptions;

use bootstrap::bootstrap::{bootstrap, BootstrapArgs};
use bucket_paths::legacy::old_bespoke_paths::bucket_path_unifier::BucketPathUnifier;
use cloud_storage::bucket_client::BucketClient;
use concurrency::relaxed_atomic_bool::RelaxedAtomicBool;
use config::common_env::CommonEnv;
use config::shared_constants::DEFAULT_MYSQL_CONNECTION_STRING;
use config::shared_constants::DEFAULT_RUST_LOG;
use errors::AnyhowResult;
use filesys::check_directory_exists::check_directory_exists;
use filesys::create_dir_all_if_missing::create_dir_all_if_missing;
use jobs_common::job_progress_reporter::job_progress_reporter::JobProgressReporterBuilder;
use jobs_common::job_progress_reporter::noop_job_progress_reporter::NoOpJobProgressReporterBuilder;
use jobs_common::job_progress_reporter::redis_job_progress_reporter::RedisJobProgressReporterBuilder;
use jobs_common::job_stats::JobStats;
use jobs_common::semi_persistent_cache_dir::SemiPersistentCacheDir;
use memory_caching::multi_item_ttl_cache::MultiItemTtlCache;
use memory_caching::ttl_key_counter::TtlKeyCounter;
use mysql_queries::common_inputs::container_environment_arg::ContainerEnvironmentArg;
use mysql_queries::mediators::firehose_publisher::FirehosePublisher;

use crate::http_server::run_http_server::launch_http_server;
use crate::http_server::run_http_server::CreateServerArgs;
use crate::job::job_loop::main_loop::main_loop;
use crate::state::job_dependencies::{BucketDependencies, ClientDependencies, DatabaseDependencies, FileSystemDetails, JobCaches, JobDependencies, JobInstanceInfo, JobSystemControls, JobSystemDependencies};
use crate::state::job_specific_dependencies::JobSpecificDependencies;
use crate::state::scoped_job_type_execution::ScopedJobTypeExecution;
use crate::state::scoped_model_type_execution::ScopedModelTypeExecution;
use crate::util::filesystem::scoped_temp_dir_creator::ScopedTempDirCreator;
use crate::util::instrumentation::JobInstruments;
use crate::util::instrumentation::{init_otel_metrics_pipeline, JobInstrumentLabels};
use crate::util::model_weights_cache::model_weights_cache_directory::ModelWeightsCacheDirectory;

pub mod http_server;
pub mod job;
pub mod state;
pub mod util;

// Buckets (shared config)
const ENV_ACCESS_KEY : &str = "ACCESS_KEY";
const ENV_SECRET_KEY : &str = "SECRET_KEY";
const ENV_REGION_NAME : &str = "REGION_NAME";

// Bucket names
const ENV_PRIVATE_BUCKET_NAME : &str = "PRIVATE_BUCKET_NAME";
const ENV_PUBLIC_BUCKET_NAME : &str = "PUBLIC_BUCKET_NAME";
const ENV_GC_ENABLED_PUBLIC_BUCKET_NAME : &str = "GC_ENABLED_PUBLIC_BUCKET_NAME";

// HTTP sidecar
const ENV_TTS_INFERENCE_SIDECAR_HOSTNAME: &str = "TTS_INFERENCE_SIDECAR_HOSTNAME";

const OTEL_METER_NAME: &str = "inference-job";



#[tokio::main]
// #[actix_web::main]
async fn main() -> AnyhowResult<()> {

  let app_name = "inference-job";

  let container_environment = bootstrap(BootstrapArgs {
    app_name,
    default_logging_override: Some(DEFAULT_RUST_LOG),
    config_search_directories: &[".", "./config", "crates/service/job/inference_job/config"],
  })?;

  info!("Hostname: {}", &container_environment.hostname);


  // NB: These are non-standard env vars we're injecting ourselves.
  let _k8s_node_name = easyenv::get_env_string_optional("K8S_NODE_NAME");
  let _k8s_pod_name = easyenv::get_env_string_optional("K8S_POD_NAME");

  // Bucket stuff (shared)
  let access_key = easyenv::get_env_string_required(ENV_ACCESS_KEY)?;
  let secret_key = easyenv::get_env_string_required(ENV_SECRET_KEY)?;
  let region_name = easyenv::get_env_string_required(ENV_REGION_NAME)?;

  // Private and Public Buckets
  let private_bucket_name = easyenv::get_env_string_required(ENV_PRIVATE_BUCKET_NAME)?;
  let public_bucket_name = easyenv::get_env_string_required(ENV_PUBLIC_BUCKET_NAME)?;
  let gc_enabled_public_bucket_name = easyenv::get_env_string_required(ENV_GC_ENABLED_PUBLIC_BUCKET_NAME)?;

  let s3_compatible_endpoint_url = easyenv::get_env_string_or_default("S3_COMPATIBLE_ENDPOINT_URL",
    "https://storage.googleapis.com");
  let bucket_timeout = easyenv::get_env_duration_seconds_or_default("BUCKET_TIMEOUT_SECONDS",
    Duration::from_secs(60 * 5));

  let private_bucket_client = BucketClient::create(
    &access_key,
    &secret_key,
    &region_name,
    &private_bucket_name,
    &s3_compatible_endpoint_url,
    None,
    Some(bucket_timeout),
  )?;

  let public_bucket_client = BucketClient::create(
    &access_key,
    &secret_key,
    &region_name,
    &public_bucket_name,
    &s3_compatible_endpoint_url,
    None,
    Some(bucket_timeout),
  )?;

  let auto_gc_bucket_client = BucketClient::create(
    &access_key,
    &secret_key,
    &region_name,
    &gc_enabled_public_bucket_name,
    &s3_compatible_endpoint_url,
    None,
    Some(bucket_timeout),
  )?;

  // Where we download models and resources to (typically a shared NFS volume in prod).

  let semi_persistent_cache = SemiPersistentCacheDir::configured_root(
    easyenv::get_env_pathbuf_or_default("SEMI_PERSISTENT_DIR_ROOT",
                                        PathBuf::from("/tmp/persistent")));

  let db_connection_string =
      easyenv::get_env_string_or_default(
        "MYSQL_URL",
        DEFAULT_MYSQL_CONNECTION_STRING);

  info!("Connecting to MySQL database...");

  let mysql_pool = MySqlPoolOptions::new()
      .max_connections(2)
      .connect(&db_connection_string)
      .await?;

  info!("Connected to MySQL.");

  let common_env = CommonEnv::read_from_env()?;

  let sidecar_max_synthesizer_models = easyenv::get_env_num(
    "SIDECAR_MAX_SYNTHESIZER_MODELS", 3)?;

  // Set to "0" to always treat low priority the same as high priority
  let low_priority_starvation_prevention_every_nth= easyenv::get_env_num(
    "LOW_PRIORITY_STARVATION_PREVENTION_EVERY_NTH", 3)?;

  let firehose_publisher = FirehosePublisher {
    mysql_pool: mysql_pool.clone(), // NB: MySqlPool is clone/send/sync safe
  };

  let maybe_minimum_priority = easyenv::get_env_string_optional("MAYBE_MINIMUM_PRIORITY")
      .map(|priority_string| {
        priority_string.parse::<u8>()
      })
      .transpose()?;

  info!("Using 'MAYBE_MINIMUM_PRIORITY' of {:?}", maybe_minimum_priority);

  let is_debug_worker = easyenv::get_env_bool_or_default("IS_DEBUG_WORKER", false);

  info!("Is debug worker? {}", is_debug_worker);

  // Optionally report job progress to the user via Redis (for now)
  // We want to turn this off in the on-premises workers since we're not tunneling to the production Redis.
  let job_progress_reporter : Box<dyn JobProgressReporterBuilder>
      = match easyenv::get_env_string_optional("REDIS_FOR_JOB_PROGRESS").as_deref()
  {
    None | Some("") => {
      warn!("Redis for job progress status reports is DISABLED! Users will not see in-flight details of inference progress.");
      Box::new(NoOpJobProgressReporterBuilder {})
    },
    Some(redis_connection_string) => {
      info!("Connecting to Redis to use for reporting job progress... {}", redis_connection_string);
      let redis_manager = RedisConnectionManager::new(redis_connection_string)?;
      let redis_pool = r2d2::Pool::builder().build(redis_manager)?;

      Box::new(RedisJobProgressReporterBuilder::from_redis_pool(redis_pool))
    }
  };

  let maybe_keepalive_redis_pool =
      match easyenv::get_env_string_optional("REDIS_FOR_KEEPALIVE_URL").as_deref() {
        None | Some("") => {
          warn!("Redis for job keepalive is DISABLED! This might break some jobs.");
          None
        },
        Some(redis_url) => {
          info!("Connecting to Redis for keepalive signals... {}", redis_url);
          let redis_manager = RedisConnectionManager::new(redis_url)?;
          let redis_pool = r2d2::Pool::builder().build(redis_manager)?;
          Some(redis_pool)
        }
      };

  // NB: Threading eats the Ctrl-C signal, so we're going to send application shutdown across
  // threads with an atomic bool.
  let application_shutdown = RelaxedAtomicBool::new(false);

  let job_stats = JobStats::new();

  let create_server_args = CreateServerArgs {
    container_environment: container_environment.clone(),
    job_stats: job_stats.clone(),
  };

  // TODO(bt,2024-07-16): Phase out model type scoping in favor of job type scoping
  let scoped_job_type_execution = ScopedJobTypeExecution::new_from_env()?;
  let scoped_model_type_execution = ScopedModelTypeExecution::new_from_env()?;

  let build_sha = std::fs::read_to_string("/GIT_SHA")
      .unwrap_or(String::from("unknown"))
      .trim()
      .to_string();

  if let Err(e) = init_otel_metrics_pipeline(
    JobInstrumentLabels{
      service_name: app_name.to_string(),
      service_namespace: container_environment.cluster_name.clone(),
      service_version: build_sha,
      service_instance_id: container_environment.hostname.clone(),
      service_job_scope: easyenv::get_env_string_optional("SCOPED_EXECUTION_MODEL_TYPES").unwrap_or_else(|| "unknown".to_string()),
    }
  ) {
    warn!("Failed to initialize OpenTelemetry metrics pipeline, continuing execution: {}", e);
  }

  let meter = opentelemetry::global::meter("inference-job");

  let job_specific_dependencies = JobSpecificDependencies::setup_for_jobs(
    &scoped_job_type_execution, &scoped_model_type_execution).await?;

  let scoped_tempdir_for_downloads = ScopedTempDirCreator::for_directory(
    easyenv::get_env_pathbuf_or_default(
      "SCOPED_TEMP_DIR_LONG_LIVED_DOWNLOADS", PathBuf::from("/tmp/downloads_long_lived")));

  let job_dependencies = JobDependencies {
    db: DatabaseDependencies {
      mysql_pool,
      maybe_redis_pool: None, // TODO(bt, 2023-01-11): See note in JobDependencies
      maybe_keepalive_redis_pool,
    },
    fs: FileSystemDetails {
      maybe_pause_file: easyenv::get_env_pathbuf_optional("PAUSE_FILE"),
      scoped_temp_dir_creator_for_short_lived_downloads: ScopedTempDirCreator::for_directory(
        easyenv::get_env_pathbuf_or_default(
          "SCOPED_TEMP_DIR_SHORT_LIVED_DOWNLOADS", PathBuf::from("/tmp/downloads_short_lived"))),
      scoped_temp_dir_creator_for_long_lived_downloads: scoped_tempdir_for_downloads.clone(),
      scoped_temp_dir_creator_for_work: ScopedTempDirCreator::for_directory(
        easyenv::get_env_pathbuf_or_default(
          "SCOPED_TEMP_DIR_WORK", PathBuf::from("/tmp/downloads_long_lived"))),
      semi_persistent_cache,
      model_weights_cache_directory: ModelWeightsCacheDirectory::setup_from_env_and_deps(
        &scoped_tempdir_for_downloads,
        &public_bucket_client,
      )?,
    },
    buckets: BucketDependencies {
      public_bucket_client,
      private_bucket_client,
      auto_gc_bucket_client,
      bucket_path_unifier: BucketPathUnifier::default_paths(),
    },
    clients: ClientDependencies {
      job_progress_reporter,
      firehose_publisher,
    },
    job: JobSystemDependencies {
      system: JobSystemControls {
        scoped_model_type_execution,
        scoped_job_type_execution,
        always_allow_cold_filesystem_cache: easyenv::get_env_bool_or_default("ALWAYS_ALLOW_COLD_FILESYSTEM_CACHE", false),
        cold_filesystem_cache_starvation_threshold: easyenv::get_env_num("COLD_FILESYSTEM_CACHE_STARVATION_THRESHOLD", 3)?,
        job_batch_wait_millis: common_env.job_batch_wait_millis,
        job_max_attempts: common_env.job_max_attempts as u16,
        job_batch_size: common_env.job_batch_size,
        no_op_logger_millis: common_env.no_op_logger_millis,
        sidecar_max_synthesizer_models,
        low_priority_starvation_prevention_every_nth,
        maybe_minimum_priority,
        is_debug_worker,
        application_shutdown: application_shutdown.clone(),
      },
      info: JobInstanceInfo {
        job_stats,
        caches: JobCaches {
          tts_model_record_cache: MultiItemTtlCache::create_with_duration(
            easyenv::get_env_duration_seconds_or_default(
              "TTS_MODEL_RECORD_CACHE_SECONDS",
              Duration::from_secs(60*5)
            ),
          ),
          vc_model_record_cache: MultiItemTtlCache::create_with_duration(
            easyenv::get_env_duration_seconds_or_default(
              "VC_MODEL_RECORD_CACHE_SECONDS",
              Duration::from_secs(60)
            ),
          ),
          model_cache_counter: TtlKeyCounter::create_with_duration(
            easyenv::get_env_duration_seconds_or_default(
              "TTL_KEY_COUNTER_CACHE_SECONDS",
              Duration::from_secs(60 * 5)
            ),
          ),
        },
        container: container_environment.clone(),
        container_db: ContainerEnvironmentArg {
          hostname: container_environment.hostname,
          cluster_name: container_environment.cluster_name,
        },
      },
      job_specific_dependencies,
    },
    job_instruments: JobInstruments::new_from_meter(meter),
  };

  set_up_directories(&job_dependencies)?;

  std::thread::spawn(move || {
    let actix_runtime = actix_web::rt::System::new();
    let http_server_handle = launch_http_server(create_server_args);

    actix_runtime.block_on(http_server_handle)
        .expect("HTTP server should not exit.");

    warn!("Server thread is shut down.");
    application_shutdown.set(true);
  });

  main_loop(job_dependencies).await;

  Ok(())
}

fn set_up_directories(job_dependencies: &JobDependencies) -> AnyhowResult<()> {
  info!("Setting up and checking file system paths for temporary work, ephemeral and persistent downloads, etc...");

  let fs = &job_dependencies.fs;

  if !job_dependencies.job.info.container.server_environment.is_deployed_in_production() {
    warn!("Creating directories for non-production / development only!");

    create_dir_all_if_missing(&fs.scoped_temp_dir_creator_for_long_lived_downloads.get_base_dir())?;
    create_dir_all_if_missing(&fs.scoped_temp_dir_creator_for_short_lived_downloads.get_base_dir())?;
    create_dir_all_if_missing(&fs.scoped_temp_dir_creator_for_work.get_base_dir())?;
  }

  check_directory_exists(fs.scoped_temp_dir_creator_for_long_lived_downloads.get_base_dir())?;
  check_directory_exists(fs.scoped_temp_dir_creator_for_short_lived_downloads.get_base_dir())?;
  check_directory_exists(fs.scoped_temp_dir_creator_for_work.get_base_dir())?;

  // TODO(bt,2023.05.22): create_all_paths() for some subset of jobs.
  info!("Creating semi-persistent cache dirs...");

  fs.semi_persistent_cache.create_custom_vocoder_model_path()?;
  fs.semi_persistent_cache.create_tts_pretrained_vocoder_model_path()?;
  fs.semi_persistent_cache.create_tts_synthesizer_model_path()?;
  fs.semi_persistent_cache.create_voice_conversion_model_path()?;
  fs.semi_persistent_cache.create_gpt_sovits_model_path()?;

  Ok(())
}
