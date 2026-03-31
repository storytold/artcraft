// Never allow these
#![forbid(private_bounds)]
#![forbid(private_interfaces)]
#![forbid(unused_must_use)]

// Always allow
#![allow(dead_code)]
#![allow(non_snake_case)]

#[macro_use] extern crate serde_derive;

use std::path::PathBuf;
use std::time::Duration;

use anyhow::anyhow;
use log::{info, warn};
use sqlx::mysql::MySqlPoolOptions;

use bootstrap::bootstrap::{bootstrap, BootstrapArgs};
use cloud_storage::bucket_client::BucketClient;
use concurrency::relaxed_atomic_bool::RelaxedAtomicBool;
use config::shared_constants::DEFAULT_MYSQL_CONNECTION_STRING;
use config::shared_constants::DEFAULT_RUST_LOG;
use errors::AnyhowResult;
use jobs_common::job_stats::JobStats;
use server_environment::ServerEnvironment;

use crate::http_server::run_http_server::{launch_http_server, CreateServerArgs};
use crate::job::main_loop::main_loop;
use crate::job_dependencies::{JobDependencies, ShardInfo};
use crate::startup::build_pager::build_pager;

pub mod http_server;
pub mod job;
pub mod job_dependencies;
pub mod startup;

// Bucket config
const ENV_ACCESS_KEY: &str = "ACCESS_KEY";
const ENV_SECRET_KEY: &str = "SECRET_KEY";
const ENV_REGION_NAME: &str = "REGION_NAME";
const ENV_PUBLIC_BUCKET_NAME: &str = "PUBLIC_BUCKET_NAME";
const ENV_S3_ENDPOINT: &str = "S3_COMPATIBLE_ENDPOINT_URL";

#[tokio::main]
async fn main() -> AnyhowResult<()> {

  let container_environment = bootstrap(BootstrapArgs {
    app_name: "video-thumbnail-job",
    default_logging_override: Some(DEFAULT_RUST_LOG),
    config_search_directories: &[".", "./config", "crates/service/job/video_thumbnail_job/config"],
    ignore_legacy_dot_env_file: true,
  })?;

  info!("Hostname: {}", &container_environment.hostname);

  let _k8s_node_name = easyenv::get_env_string_optional("K8S_NODE_NAME");
  let _k8s_pod_name = easyenv::get_env_string_optional("K8S_POD_NAME");

  let db_connection_string = easyenv::get_env_string_or_default(
    "MYSQL_URL",
    DEFAULT_MYSQL_CONNECTION_STRING,
  );

  info!("Connecting to database...");

  let mysql_pool = MySqlPoolOptions::new()
    .max_connections(2)
    .connect(&db_connection_string)
    .await?;

  info!("Connected to MySQL.");

  let server_environment = ServerEnvironment::from_str(
    &easyenv::get_env_string_required("SERVER_ENVIRONMENT")?,
  )
    .ok_or(anyhow!("invalid server environment"))?;

  // Bucket setup
  let access_key = easyenv::get_env_string_required(ENV_ACCESS_KEY)?;
  let secret_key = easyenv::get_env_string_required(ENV_SECRET_KEY)?;
  let region_name = easyenv::get_env_string_required(ENV_REGION_NAME)?;
  let public_bucket_name = easyenv::get_env_string_required(ENV_PUBLIC_BUCKET_NAME)?;
  let s3_compatible_endpoint_url = easyenv::get_env_string_required(ENV_S3_ENDPOINT)?;

  let bucket_timeout = easyenv::get_env_duration_seconds_or_default(
    "BUCKET_TIMEOUT_SECONDS",
    Duration::from_secs(60 * 5),
  );

  let public_bucket_client = BucketClient::create(
    &access_key,
    &secret_key,
    &region_name,
    &public_bucket_name,
    &s3_compatible_endpoint_url,
    None,
    Some(bucket_timeout),
  )?;

  // Job polling and timing configuration
  let poll_interval_millis: u64 = easyenv::get_env_num(
    "VIDEO_THUMBNAIL_POLL_INTERVAL_MILLIS",
    30_000,
  )?;

  let query_delay_millis: u64 = easyenv::get_env_num(
    "VIDEO_THUMBNAIL_QUERY_DELAY_MILLIS",
    100,
  )?;

  let query_failure_retry_delay_millis: u64 = easyenv::get_env_num(
    "VIDEO_THUMBNAIL_QUERY_FAILURE_RETRY_DELAY_MILLIS",
    10_000,
  )?;

  // Optional overrides for query parameters
  let custom_max_lookback_hours: Option<i32> = easyenv::get_env_string_optional(
    "VIDEO_THUMBNAIL_MAX_LOOKBACK_HOURS",
  ).and_then(|s| s.parse().ok());

  let custom_page_size: Option<i64> = easyenv::get_env_string_optional(
    "VIDEO_THUMBNAIL_PAGE_SIZE",
  ).and_then(|s| s.parse().ok());

  // Temp directory for video downloads and thumbnail intermediates
  let temp_dir: PathBuf = easyenv::get_env_pathbuf_or_default(
    "VIDEO_THUMBNAIL_TEMP_DIR",
    "/tmp/video-thumbnails",
  );

  // Ensure the temp directory exists
  tokio::fs::create_dir_all(&temp_dir).await?;

  // Optional sharding configuration
  let maybe_number_of_shards: Option<u8> = easyenv::get_env_string_optional("NUMBER_OF_SHARDS")
      .and_then(|s| s.parse().ok());
  let maybe_shard_index: Option<u8> = easyenv::get_env_string_optional("SHARD_INDEX")
      .and_then(|s| s.parse().ok());

  let shard_info = match (maybe_number_of_shards, maybe_shard_index) {
    (Some(number_of_shards), Some(shard_index)) => {
      info!("Sharding enabled: shard {shard_index} of {number_of_shards}");
      Some(ShardInfo { number_of_shards, shard_index })
    }
    _ => {
      info!("Sharding disabled: processing all media files.");
      None
    }
  };

  let (pager, pager_worker) = build_pager(server_environment, &container_environment.hostname);

  info!("Spawning pager worker.");

  // NB: The pager worker uses Condvar::wait() which is a blocking syscall.
  // It must run on a dedicated OS thread, not a tokio task, to avoid blocking
  // the tokio runtime.
  std::thread::spawn(move || {
    let rt = tokio::runtime::Runtime::new().expect("pager worker tokio runtime");
    rt.block_on(pager_worker.run());
  });

  let application_shutdown = RelaxedAtomicBool::new(false);
  let job_stats = JobStats::new();

  let pager_for_shutdown = pager.clone();

  let create_server_args = CreateServerArgs {
    container_environment: container_environment.clone(),
    job_stats: job_stats.clone(),
    pager: pager.clone(),
  };

  let job_dependencies = JobDependencies {
    mysql_pool,
    public_bucket_client,
    server_environment,
    job_stats,
    poll_interval_millis,
    query_delay_millis,
    query_failure_retry_delay_millis,
    custom_max_lookback_hours,
    custom_page_size,
    temp_dir,
    shard_info,
    application_shutdown: application_shutdown.clone(),
    pager,
  };

  // HTTP server runs on a separate OS thread with its own actix System.
  std::thread::spawn(move || {
    let actix_runtime = actix_web::rt::System::new();
    let http_server_handle = launch_http_server(create_server_args);

    actix_runtime.block_on(http_server_handle)
      .expect("HTTP server should not exit.");

    warn!("HTTP server thread is shut down.");
  });

  // Listen for SIGTERM / Ctrl-C to trigger graceful shutdown.
  let application_shutdown_for_signal = application_shutdown.clone();

  tokio::spawn(async move {
    match tokio::signal::ctrl_c().await {
      Ok(()) => {
        info!("Received shutdown signal. Shutting down...");
        application_shutdown_for_signal.set(true);
      }
      Err(err) => {
        warn!("Error listening for shutdown signal: {:?}", err);
      }
    }
  });

  main_loop(job_dependencies).await;

  info!("Shutting down pager worker...");
  pager_for_shutdown.shutdown_worker();

  info!("Video thumbnail job exiting.");

  Ok(())
}
