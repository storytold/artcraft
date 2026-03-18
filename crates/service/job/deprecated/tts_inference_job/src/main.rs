// Never allow these
#![forbid(private_bounds)]
#![forbid(private_interfaces)]
#![forbid(unused_must_use)] // NB: It's unsafe to not close/check some things

// Okay to toggle
//#![forbid(warnings)]
//#![forbid(unreachable_patterns)]
#![forbid(unused_imports)]
#![forbid(unused_mut)]
#![forbid(unused_variables)]

// Always allow
#![allow(dead_code)]
#![allow(non_snake_case)]

#[macro_use] extern crate serde_derive;

use std::path::PathBuf;
use std::time::Duration;

use log::{error, info, warn};
use r2d2_redis::r2d2;
use r2d2_redis::RedisConnectionManager;
use sqlx::mysql::MySqlPoolOptions;
use sqlx::MySqlPool;

use cloud_storage::bucket_client::BucketClient;
use bucket_paths::legacy::old_bespoke_paths::bucket_path_unifier::BucketPathUnifier;
use collections::multiple_random_from_vec::multiple_random_from_vec;
use config::common_env::CommonEnv;
use config::shared_constants::DEFAULT_MYSQL_CONNECTION_STRING;
use config::shared_constants::DEFAULT_RUST_LOG;
use errors::AnyhowResult;
use filesys::check_directory_exists::check_directory_exists;
use jobs_common::job_progress_reporter::job_progress_reporter::JobProgressReporterBuilder;
use jobs_common::job_progress_reporter::noop_job_progress_reporter::NoOpJobProgressReporterBuilder;
use jobs_common::job_progress_reporter::redis_job_progress_reporter::RedisJobProgressReporterBuilder;
use jobs_common::job_stats::JobStats;
use jobs_common::noop_logger::NoOpLogger;
use jobs_common::semi_persistent_cache_dir::SemiPersistentCacheDir;
use memory_caching::multi_item_ttl_cache::MultiItemTtlCache;
use mysql_queries::mediators::firehose_publisher::FirehosePublisher;
use mysql_queries::queries::tts::tts_inference_jobs::list_available_tts_inference_jobs::{AvailableTtsInferenceJob, list_available_tts_inference_jobs, list_available_tts_inference_jobs_with_minimum_priority};
use mysql_queries::queries::tts::tts_inference_jobs::mark_tts_inference_job_failure::mark_tts_inference_job_failure;
use mysql_queries::queries::tts::tts_inference_jobs::mark_tts_inference_job_permanently_dead::mark_tts_inference_job_permanently_dead;
use mysql_queries::queries::tts::tts_models::get_tts_model_for_inference::{get_tts_model_for_inference, TtsModelForInferenceError, TtsModelForInferenceRecord};

use crate::caching::cache_miss_strategizer::CacheMissStrategizer;
use crate::caching::cache_miss_strategizer::CacheMissStrategy;
use crate::caching::cache_miss_strategizer_multi::SyncMultiCacheMissStrategizer;
use crate::caching::virtual_lfu_cache::SyncVirtualLfuCache;
use crate::http_clients::tts_inference_sidecar_client::TtsInferenceSidecarClient;
use crate::http_clients::tts_sidecar_health_check_client::TtsSidecarHealthCheckClient;
use crate::job_steps::health_check_trap::maybe_block_on_sidecar_health_check;
use crate::job_steps::job_args::{JobArgs, JobCaches, JobHttpClients};
use crate::job_steps::job_args::JobWorkerDetails;
use crate::job_steps::process_single_job::process_single_job;
use crate::job_steps::process_single_job_error::ProcessSingleJobError;
use crate::util::scoped_temp_dir_creator::ScopedTempDirCreator;

pub mod caching;
pub mod http_clients;
pub mod job_steps;
pub mod util;

// Buckets (shared config)
const ENV_ACCESS_KEY : &str = "ACCESS_KEY";
const ENV_SECRET_KEY : &str = "SECRET_KEY";
const ENV_REGION_NAME : &str = "REGION_NAME";

// Bucket names
const ENV_PRIVATE_BUCKET_NAME : &str = "PRIVATE_BUCKET_NAME";
const ENV_PUBLIC_BUCKET_NAME : &str = "PUBLIC_BUCKET_NAME";

// Where models and other assets get downloaded to.
const ENV_SEMIPERSISTENT_CACHE_DIR : &str = "SEMIPERSISTENT_CACHE_DIR";

// Python code
const ENV_CODE_DIRECTORY : &str = "TTS_CODE_DIRECTORY";
const ENV_INFERENCE_SCRIPT_NAME : &str = "TTS_INFERENCE_SCRIPT_NAME";

// HTTP sidecar
const ENV_TTS_INFERENCE_SIDECAR_HOSTNAME: &str = "TTS_INFERENCE_SIDECAR_HOSTNAME";

const DEFAULT_TEMP_DIR: &str = "/tmp";

#[tokio::main]
async fn main() -> AnyhowResult<()> {
  easyenv::init_all_with_default_logging(Some(DEFAULT_RUST_LOG));

  // NB: Do not check this secrets-containing dotenv file into VCS.
  // This file should only contain *development* secrets, never production.
  let _ = dotenv::from_filename(".env-secrets").ok();

  info!("Obtaining worker hostname...");

  let server_hostname = hostname::get()
      .ok()
      .and_then(|h| h.into_string().ok())
      .unwrap_or("tts-inference-job".to_string());

  // NB: These are non-standard env vars we're injecting ourselves.
  let k8s_node_name = easyenv::get_env_string_optional("K8S_NODE_NAME");
  let k8s_pod_name = easyenv::get_env_string_optional("K8S_POD_NAME");

  // NB: It'll be worthwhile to see how much compute is happening at our local on-premises cluster
  // Only our local workers will set this to true.
  let is_on_prem = easyenv::get_env_bool_or_default("IS_ON_PREM", false);

  info!("Hostname: {}", &server_hostname);
  info!("Is on-premises: {}", is_on_prem);

  // Bucket stuff (shared)
  let access_key = easyenv::get_env_string_required(ENV_ACCESS_KEY)?;
  let secret_key = easyenv::get_env_string_required(ENV_SECRET_KEY)?;
  let region_name = easyenv::get_env_string_required(ENV_REGION_NAME)?;

  // Private and Public Buckets
  let private_bucket_name = easyenv::get_env_string_required(ENV_PRIVATE_BUCKET_NAME)?;
  let public_bucket_name = easyenv::get_env_string_required(ENV_PUBLIC_BUCKET_NAME)?;

  let s3_compatible_endpoint_url = easyenv::get_env_string_or_default(
    "S3_COMPATIBLE_ENDPOINT_URL",
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

  let sidecar_hostname =
      easyenv::get_env_string_required(ENV_TTS_INFERENCE_SIDECAR_HOSTNAME)?;

  info!("Sidecar hostname: {:?}", sidecar_hostname);

  let tts_inference_sidecar_client =
      TtsInferenceSidecarClient::new(&sidecar_hostname);

  let tts_sidecar_health_check_client=
      TtsSidecarHealthCheckClient::new(&sidecar_hostname)?;

  let temp_directory = easyenv::get_env_string_or_default(
    "DOWNLOAD_TEMP_DIR",
    DEFAULT_TEMP_DIR);

  let temp_directory = PathBuf::from(temp_directory);

  check_directory_exists(&temp_directory)?;

  let db_connection_string =
      easyenv::get_env_string_or_default(
        "MYSQL_URL",
        DEFAULT_MYSQL_CONNECTION_STRING);

  info!("Connecting to database...");

  let mysql_pool = MySqlPoolOptions::new()
      .max_connections(2)
      .connect(&db_connection_string)
      .await?;

  let common_env = CommonEnv::read_from_env()?;


  let persistent_cache_path = easyenv::get_env_string_or_default(
    ENV_SEMIPERSISTENT_CACHE_DIR,
    "/tmp");

  let semi_persistent_cache =
      SemiPersistentCacheDir::configured_root(&persistent_cache_path);

  info!("Creating pod semi-persistent cache dirs...");
  semi_persistent_cache.create_tts_synthesizer_model_path()?;
  semi_persistent_cache.create_tts_pretrained_vocoder_model_path()?;
  semi_persistent_cache.create_custom_vocoder_model_path()?;
  semi_persistent_cache.create_gpt_sovits_model_path()?;

  let waveglow_vocoder_model_filename = easyenv::get_env_string_or_default(
    "TTS_WAVEGLOW_VOCODER_MODEL_FILENAME", "waveglow.pth");

  let hifigan_vocoder_model_filename = easyenv::get_env_string_or_default(
    "TTS_HIFIGAN_VOCODER_MODEL_FILENAME", "hifigan.pth");

  let hifigan_superres_vocoder_model_filename = easyenv::get_env_string_or_default(
    "TTS_HIFIGAN_SUPERRES_VOCODER_MODEL_FILENAME", "hifigan_superres.pth");

  let sidecar_max_synthesizer_models = easyenv::get_env_num(
    "SIDECAR_MAX_SYNTHESIZER_MODELS", 3)?;

  // Set to "0" to always treat low priority the same as high priority
  let low_priority_starvation_prevention_every_nth= easyenv::get_env_num(
    "LOW_PRIORITY_STARVATION_PREVENTION_EVERY_NTH", 3)?;

  let firehose_publisher = FirehosePublisher {
    mysql_pool: mysql_pool.clone(), // NB: MySqlPool is clone/send/sync safe
  };

  let virtual_lfu_cache = SyncVirtualLfuCache::new(sidecar_max_synthesizer_models)?;

  let cache_miss_strategizers = {
    let in_memory_strategizer = CacheMissStrategizer::new(
      chrono::Duration::milliseconds(
        easyenv::get_env_num("MEMORY_MAX_COLD_DURATION_MILLIS", 5_000)?,
      ),
      chrono::Duration::milliseconds(
        easyenv::get_env_num("MEMORY_CACHE_FORGET_DURATION_MILLIS", 60_000)?,
      ),
    );

    let on_disk_strategizer = CacheMissStrategizer::new(
      chrono::Duration::milliseconds(
        easyenv::get_env_num("DISK_MAX_COLD_DURATION_MILLIS", 20_000)?,
      ),
      chrono::Duration::milliseconds(
        easyenv::get_env_num("DISK_CACHE_FORGET_DURATION_MILLIS", 120_000)?,
      ),
    );

    SyncMultiCacheMissStrategizer::new(
      in_memory_strategizer,
      on_disk_strategizer,
    )
  };

  let model_cache_duration = std::time::Duration::from_millis(
    easyenv::get_env_num("TTS_MODEL_RECORD_CACHE_MILLIS", 300_000)?, // Five minutes
  );

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
  let job_progress_reporter : Box<dyn JobProgressReporterBuilder> =
      match easyenv::get_env_string_optional("REDIS_FOR_JOB_PROGRESS")
  {
    None => {
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

  let inferencer = JobArgs {
    scoped_temp_dir_creator: ScopedTempDirCreator::for_directory(&temp_directory),
    download_temp_directory: temp_directory,
    mysql_pool,
    job_progress_reporter,
    public_bucket_client,
    private_bucket_client,
    http_clients: JobHttpClients {
      tts_inference_sidecar_client,
      tts_sidecar_health_check_client,
    },
    job_stats: JobStats::new(),
    worker_details: JobWorkerDetails {
      is_on_prem,
      worker_hostname: server_hostname.clone(),
      k8s_node_name,
      k8s_pod_name,
      is_debug_worker,
    },
    caches: JobCaches {
      tts_model_record_cache: MultiItemTtlCache::create_with_duration(model_cache_duration),
    },
    virtual_model_lfu: virtual_lfu_cache,
    cache_miss_strategizers,
    bucket_path_unifier: BucketPathUnifier::default_paths(),
    semi_persistent_cache,
    firehose_publisher,
    waveglow_vocoder_model_filename,
    hifigan_vocoder_model_filename,
    hifigan_superres_vocoder_model_filename,
    job_batch_wait_millis: common_env.job_batch_wait_millis,
    job_max_attempts: common_env.job_max_attempts as i32,
    job_batch_size: common_env.job_batch_size,
    no_op_logger_millis: common_env.no_op_logger_millis,
    sidecar_max_synthesizer_models,
    low_priority_starvation_prevention_every_nth,
    maybe_minimum_priority,
  };

  main_loop(inferencer).await;

  Ok(())
}

// Job runner timeouts (guards MySQL)
const START_TIMEOUT_MILLIS : u64 = 500;
const INCREASE_TIMEOUT_MILLIS : u64 = 1000;

async fn main_loop(job_args: JobArgs) {
  let mut error_timeout_millis = START_TIMEOUT_MILLIS;

  let mut noop_logger = NoOpLogger::new(job_args.no_op_logger_millis as i64);

  let mut sort_by_priority = true;
  let mut sort_by_priority_count = 0;

  let mut needs_health_check_at_start = true; // Run health check at startup.

  loop {
    let num_records = job_args.job_batch_size;

    // Don't completely starve low-priority jobs
    if sort_by_priority_count >= job_args.low_priority_starvation_prevention_every_nth {
      sort_by_priority_count = 0;
      sort_by_priority = false;
    }

    let maybe_available_jobs =
        if let Some(minimum_priority) = job_args.maybe_minimum_priority {
          // Special high-priority workers
          list_available_tts_inference_jobs_with_minimum_priority(
            &job_args.mysql_pool,
            minimum_priority,
            num_records,
            job_args.worker_details.is_debug_worker
          ).await
        } else {
          // Normal path
          list_available_tts_inference_jobs(
            &job_args.mysql_pool,
            sort_by_priority,
            num_records,
            job_args.worker_details.is_debug_worker
          ).await
        };

    sort_by_priority = true;
    sort_by_priority_count += 1;

    let jobs = match maybe_available_jobs {
      Ok(jobs) => jobs,
      Err(e) => {
        warn!("Error querying jobs: {:?}", e);
        std::thread::sleep(Duration::from_millis(error_timeout_millis));
        error_timeout_millis += INCREASE_TIMEOUT_MILLIS;
        continue;
      }
    };

    if jobs.is_empty() {
      noop_logger.log_message_after_awhile("No TTS jobs picked up from database!");

      std::thread::sleep(Duration::from_millis(job_args.job_batch_wait_millis));
      continue;
    }

    info!("Queried {} jobs from database", jobs.len());

    let batch_result = process_jobs(
      &job_args,
      jobs,
      needs_health_check_at_start,
    ).await;

    if needs_health_check_at_start {
      needs_health_check_at_start = false;
    }

    if let Err(e) = batch_result {
      warn!("Error running job batch: {:?}", e);
      std::thread::sleep(Duration::from_millis(error_timeout_millis));
      error_timeout_millis += INCREASE_TIMEOUT_MILLIS;
      continue;
    }

    error_timeout_millis = START_TIMEOUT_MILLIS; // reset

    std::thread::sleep(Duration::from_millis(job_args.job_batch_wait_millis));
  }
}

/// Process a batch of jobs, returning the count of cold-cache skipped jobs.
async fn process_jobs(
  inferencer: &JobArgs,
  jobs: Vec<AvailableTtsInferenceJob>,
  needs_health_check_at_start: bool,
) -> AnyhowResult<()> {

  if needs_health_check_at_start {
    maybe_block_on_sidecar_health_check(&inferencer.http_clients.tts_sidecar_health_check_client).await;
  }

  let mut maybe_sidecar_health_issue = false;

  for job in jobs.into_iter() {
    let model_state_result = ModelState::query_model_and_check_filesystem(
      &job,
      &inferencer.mysql_pool,
      &inferencer.caches.tts_model_record_cache,
      &inferencer.semi_persistent_cache,
      &inferencer.virtual_model_lfu,
    ).await;

    let model_state = match model_state_result {
      Ok(model_state) => model_state,
      Err(e) => {
        error!("TTS model fetch and state check error: {}, reason: {:?}", &job.model_token, &e);

        let (failure_reason, permanent_failure) = match e {
          ModelStateError::ModelNotFound => ("model was not found", true),
          ModelStateError::ModelDeleted => ("model has been deleted", true),
          ModelStateError::CacheError { .. } => ("internal cache error", false),
          ModelStateError::DatabaseError { .. } => ("unknown database error", false),
        };

        let internal_debugging_failure_reason = format!("model error: {:?}", e);

        let mut job_progress_reporter = inferencer
            .job_progress_reporter
            .new_tts_inference(&job.inference_job_token)?;

        job_progress_reporter.log_status(failure_reason)?;

        if permanent_failure {
          warn!("Marking job permanently dead: {} because: {:?}", job.inference_job_token, &e);

          let _r = mark_tts_inference_job_permanently_dead(
            &inferencer.mysql_pool,
            job.id,
            failure_reason,
            &internal_debugging_failure_reason,
            &inferencer.get_worker_name(),
          ).await;
        } else {
          let _r = mark_tts_inference_job_failure(
            &inferencer.mysql_pool,
            &job,
            failure_reason,
            &internal_debugging_failure_reason,
            inferencer.job_max_attempts,
            &inferencer.get_worker_name(),
          ).await;
        }

        continue;
      }
    };

    if !model_state.is_downloaded_to_filesystem || !model_state.is_in_memory_cache {
      warn!("Model isn't ready: {} (downloaded = {}), (in memory = {})",
        &model_state.model_record.model_token,
        model_state.is_downloaded_to_filesystem,
        model_state.is_in_memory_cache);

      let maybe_strategy = if !model_state.is_downloaded_to_filesystem {
        inferencer.cache_miss_strategizers.disk_cache_miss(&model_state.model_record.model_token)
      } else {
        inferencer.cache_miss_strategizers.memory_cache_miss(&model_state.model_record.model_token)
      };

      match maybe_strategy {
        Err(err) => {
          warn!("Unable to process job: {:?}", err);

          let failure_reason = "cache error";
          let internal_debugging_failure_reason = format!("cache error: {:?}", err);

          let _r = mark_tts_inference_job_failure(
            &inferencer.mysql_pool,
            &job,
            failure_reason,
            &internal_debugging_failure_reason,
            inferencer.job_max_attempts,
            &inferencer.get_worker_name(),
          ).await;
          continue;
        },
        Ok(CacheMissStrategy::WaitOrSkip) => {
          // We're going to skip this for now.
          // Maybe another worker has a warm cache and can continue.
          warn!("Skipping TTS due to cold cache: {} ({})",
            model_state.model_record.model_token,
            model_state.model_record.title);
          continue;
        },
        Ok(CacheMissStrategy::Proceed) => {}, // We're going to go ahead...
      }
    }

    if maybe_sidecar_health_issue {
      // Since we'll have a signal of the sidecar's health potentially being an issue, we don't
      // need to background health check it from another thread. Instead we can react to the
      // "potentially down" signal and block until it alleviates.
      maybe_block_on_sidecar_health_check(&inferencer.http_clients.tts_sidecar_health_check_client).await;
      maybe_sidecar_health_issue = false;
    }

    let result = process_single_job(inferencer, &job, &model_state.model_record).await;
    if let Err(e) = result {
      warn!("Failure to process job: {:?}", e);

      record_failure_and_maybe_slow_down(&inferencer.job_stats);

      maybe_sidecar_health_issue = true;

      let failure_reason = "failure processing job";
      let internal_debugging_failure_reason = format!("job error: {:?}", e);

      let _r = mark_tts_inference_job_failure(
        &inferencer.mysql_pool,
        &job,
        failure_reason,
        &internal_debugging_failure_reason,
        inferencer.job_max_attempts,
        &inferencer.get_worker_name(),
      ).await;

      match e {
        ProcessSingleJobError::Other(_) => {} // No-op
        ProcessSingleJobError::FilesystemFull => {
          // TODO: Refactor - we should stop processing all of these jobs as we'll lose out
          //  on this entire batch by attempting to clear the filesystem. This should be handled
          //  in the calling code.
          delete_tts_synthesizers_from_cache(&inferencer.semi_persistent_cache)?;
        }
      }
    }
  }

  Ok(())
}

fn record_failure_and_maybe_slow_down(job_stats: &JobStats) {
  let stats = match job_stats.increment_failure_count() {
    Ok(stats) => stats,
    Err(e) => {
      warn!("Error recording stats and reacting to repeated failures: {:?}", e);
      return; // Can't really do anything.
    }
  };

  let seconds_timeout = match stats.consecutive_failure_count {
    t if t > 100 => 180,
    t if t > 50 => 60,
    t if t > 20 => 30,
    t if t > 10 => 10,
    t if t > 5 => 5,
    _ => return, // No timeout
  };

  info!("Slowing down {} seconds due to significant repeated failures: {:?}",
    seconds_timeout,
    stats);

  std::thread::sleep(Duration::from_secs(seconds_timeout));
}

/// Hack to delete locally cached TTS synthesizers to free up space from a full filesystem.
/// This is not intelligent and doesn't use any LRU/LFU mechanic.
/// This also relies on files not being read or written by concurrent workers while deleting.
fn delete_tts_synthesizers_from_cache(cache_dir: &SemiPersistentCacheDir) -> AnyhowResult<()> {
  warn!("Deleting cached TTS synthesizers to free up disk space.");

  let tts_synthesizer_dir = cache_dir.tts_synthesizer_model_directory();

  // TODO: When this is no longer sufficient, delete other types of locally-cached data.
  let paths = std::fs::read_dir(tts_synthesizer_dir)?
      .map(|res| res.map(|e| e.path()))
      .collect::<Result<Vec<_>, std::io::Error>>()?;

  let models_to_delete = multiple_random_from_vec(&paths, 35);

  for model_to_delete in models_to_delete {
    warn!("Deleting cached model file: {:?}", model_to_delete);

    let full_model_path = cache_dir.tts_synthesizer_model_path(model_to_delete);
    std::fs::remove_file(full_model_path)?;
  }

  Ok(())
}

/// We check both of these in one go so that we can reuse the ModelRecord later
/// without another DB query.
struct ModelState {
  pub model_record: TtsModelForInferenceRecord,
  pub is_downloaded_to_filesystem: bool,
  pub is_in_memory_cache: bool,
}

#[derive(Debug, Clone)]
enum ModelStateError {
  ModelNotFound,
  ModelDeleted,
  CacheError { reason: String },
  DatabaseError { reason: String },
}

impl std::fmt::Display for ModelStateError {
  fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
    match self {
      ModelStateError::ModelNotFound => write!(f, "ModelNotFound"),
      ModelStateError::ModelDeleted => write!(f, "ModelDeleted"),
      ModelStateError::CacheError { reason} => write!(f, "Cache error: {:?}", reason),
      ModelStateError::DatabaseError { reason} => write!(f, "Database error: {:?}", reason),
    }
  }
}

impl From<TtsModelForInferenceError> for ModelStateError {
  fn from(error: TtsModelForInferenceError) -> Self {
    match error {
      TtsModelForInferenceError::ModelNotFound => ModelStateError::ModelNotFound,
      TtsModelForInferenceError::ModelDeleted => ModelStateError::ModelDeleted,
      TtsModelForInferenceError::DatabaseError { reason } => ModelStateError::DatabaseError { reason }
    }
  }
}

impl std::error::Error for ModelStateError {}

impl ModelState {
  /// Query the model details and see if the model file is on the filesystem in one go.
  pub async fn query_model_and_check_filesystem(
    job: &AvailableTtsInferenceJob,
    mysql_pool: &MySqlPool,
    tts_model_record_cache: &MultiItemTtlCache<String, TtsModelForInferenceRecord>,
    semi_persistent_cache: &SemiPersistentCacheDir,
    virtual_cache: &SyncVirtualLfuCache,
  ) -> Result<Self, ModelStateError> {
    // Many workers will be querying models constantly (n-many per batch).
    // We can save on a lot of DB query volume by caching model records.
    let maybe_cached_tts_model =
        tts_model_record_cache.copy_without_bump_if_unexpired(job.model_token.clone())
            .ok()
            .flatten();

    let tts_model = match maybe_cached_tts_model {
      Some(tts_model) => tts_model,
      None => {
        info!("Looking up TTS model record by token: {}", &job.model_token);

        let tts_model = get_tts_model_for_inference(
          &mysql_pool,
          &job.model_token
        ).await?;

        tts_model_record_cache.store_copy(&job.model_token, &tts_model).ok();

        tts_model
      }
    };

    let tts_synthesizer_fs_path = semi_persistent_cache.tts_synthesizer_model_path(
      &tts_model.model_token);

    let is_downloaded_to_filesystem = tts_synthesizer_fs_path.exists();

    let path = tts_synthesizer_fs_path
        .to_str()
        .ok_or(ModelStateError::CacheError { reason: "could not make path".to_string() })?
        .to_string();

    let is_in_memory_cache = virtual_cache.in_cache(&path)
        .map_err(|e| ModelStateError::CacheError { reason: format!("Model cache error: {:?}", e) })?;

    Ok(Self {
      model_record: tts_model,
      is_downloaded_to_filesystem,
      is_in_memory_cache,
    })
  }
}

