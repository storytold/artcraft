// Never allow these
#![forbid(private_bounds)]
#![forbid(private_interfaces)]
#![forbid(unused_must_use)]

// Always allow
#![allow(dead_code)]
#![allow(non_snake_case)]

#[macro_use] extern crate serde_derive;

use std::sync::Arc;
use std::time::Duration;

use anyhow::anyhow;
use log::{info, warn};
use sqlx::mysql::MySqlPoolOptions;
use tokio::sync::Notify;

use bootstrap::bootstrap::{bootstrap, BootstrapArgs};
use cloud_storage::bucket_client::BucketClient;
use concurrency::relaxed_atomic_bool::RelaxedAtomicBool;
use errors::AnyhowResult;
use grok_api_client::creds::grok_api_key::GrokApiKey;
use jobs_common::job_stats::JobStats;
use server_environment::ServerEnvironment;
use shared_env_var_config::logging::DEFAULT_RUST_LOG;
use shared_env_var_config::mysql::env_get_mysql_connection_string_or_default;

use crate::http_server::run_http_server::{launch_http_server, CreateServerArgs};
use crate::job_dependencies::JobDependencies;
use crate::jobs::image_generation_job::image_generation_main_loop::image_generation_main_loop;
use crate::jobs::video_polling_job::video_polling_main_loop::video_polling_main_loop;
use crate::startup::build_pager::build_pager;

pub mod http_server;
pub mod job_dependencies;
pub mod jobs;
pub mod startup;

// Bucket config
const ENV_ACCESS_KEY: &str = "ACCESS_KEY";
const ENV_SECRET_KEY: &str = "SECRET_KEY";
const ENV_REGION_NAME: &str = "REGION_NAME";
const ENV_PUBLIC_BUCKET_NAME: &str = "PUBLIC_BUCKET_NAME";
const ENV_S3_ENDPOINT: &str = "S3_COMPATIBLE_ENDPOINT_URL";
const ENV_GROK_API_KEY: &str = "GROK_API_KEY";

#[tokio::main]
async fn main() -> AnyhowResult<()> {

  let container_environment = bootstrap(BootstrapArgs {
    app_name: "grok-api-job",
    default_logging_override: Some(DEFAULT_RUST_LOG),
    config_search_directories: &[".", "./config", "crates/service/job/grok_api_job/config"],
    ignore_legacy_dot_env_file: true,
  })?;

  info!("Hostname: {}", &container_environment.hostname);

  let _k8s_node_name = easyenv::get_env_string_optional("K8S_NODE_NAME");
  let _k8s_pod_name = easyenv::get_env_string_optional("K8S_POD_NAME");

  let db_connection_string = env_get_mysql_connection_string_or_default();

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

  // Grok API key
  let grok_api_key_str = easyenv::get_env_string_required(ENV_GROK_API_KEY)?;
  let grok_api_key = GrokApiKey::new(grok_api_key_str);

  // How often to poll after a successful iteration (default: 5 seconds)
  let poll_interval_success_millis: u64 = easyenv::get_env_num(
    "GROK_POLL_INTERVAL_SUCCESS_MILLIS",
    5_000,
  )?;

  // How often to poll after a failed iteration (default: 15 seconds)
  let poll_interval_failure_millis: u64 = easyenv::get_env_num(
    "GROK_POLL_INTERVAL_FAILURE_MILLIS",
    15_000,
  )?;

  // Stub image_generation_job tick interval (default: 60 seconds).
  let image_generation_poll_interval_millis: u64 = easyenv::get_env_num(
    "GROK_IMAGE_POLL_INTERVAL_MILLIS",
    60_000,
  )?;

  let application_shutdown = RelaxedAtomicBool::new(false);
  let shutdown_notify = Arc::new(Notify::new());
  let job_stats = JobStats::new();

  // Pager setup
  let (pager, pager_worker) = build_pager(server_environment, &container_environment.hostname);

  info!("Spawning pager worker.");

  // NB: The pager worker uses Condvar::wait() which is a blocking syscall.
  // It must run on a dedicated OS thread, not a tokio task, to avoid blocking
  // the tokio runtime.
  std::thread::spawn(move || {
    let rt = tokio::runtime::Runtime::new().expect("pager worker tokio runtime");
    rt.block_on(pager_worker.run());
  });

  let pager_for_shutdown = pager.clone();

  let create_server_args = CreateServerArgs {
    container_environment: container_environment.clone(),
    job_stats: job_stats.clone(),
  };

  let job_dependencies = JobDependencies {
    mysql_pool,
    public_bucket_client,
    grok_api_key,
    server_environment,
    pager,
    job_stats,
    poll_interval_success_millis,
    poll_interval_failure_millis,
    image_generation_poll_interval_millis,
    application_shutdown: application_shutdown.clone(),
    shutdown_notify: shutdown_notify.clone(),
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
  let shutdown_notify_for_signal = shutdown_notify.clone();

  tokio::spawn(async move {
    match tokio::signal::ctrl_c().await {
      Ok(()) => {
        info!("Received shutdown signal. Shutting down...");
        application_shutdown_for_signal.set(true);
        shutdown_notify_for_signal.notify_waiters();
      }
      Err(err) => {
        warn!("Error listening for shutdown signal: {:?}", err);
      }
    }
  });

  // Spawn all polling loops as concurrent tasks.
  let video_deps = job_dependencies.clone();
  let image_deps = job_dependencies;

  let video_handle = tokio::spawn(async move {
    video_polling_main_loop(video_deps).await;
  });

  let image_handle = tokio::spawn(async move {
    image_generation_main_loop(image_deps).await;
  });

  let _ = tokio::join!(video_handle, image_handle);

  info!("Shutting down pager worker...");
  pager_for_shutdown.shutdown_worker();

  info!("Grok API job exiting.");

  Ok(())
}
