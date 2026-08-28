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
use log::{error, info, warn};
use sqlx::mysql::MySqlPoolOptions;
use tokio::sync::Notify;

use bootstrap::bootstrap::{bootstrap, BootstrapArgs};
use cloud_storage::legacy_bucket_client::LegacyBucketClient;
use concurrency::relaxed_atomic_bool::RelaxedAtomicBool;
use shared_env_var_config::logging::DEFAULT_RUST_LOG;
use errors::AnyhowResult;
use jobs_common::job_stats::JobStats;
use kinovi_web_client::creds::kinovi_web_session::KinoviWebSession;
use server_environment::ServerEnvironment;
use shared_env_var_config::mysql::env_get_mysql_connection_string_or_default;

use crate::http_server::run_http_server::{launch_http_server, CreateServerArgs};
use crate::jobs::character_polling_job::character_polling_main_loop::character_polling_main_loop;
use crate::jobs::credits_checking_job::credits_checking_main_loop::credits_checking_main_loop;
use crate::jobs::order_polling_job::order_polling_main_loop::order_polling_main_loop;
use crate::jobs::order_processing_job::order_processing_main_loop::order_processing_main_loop;
use crate::job_dependencies::JobDependencies;
use crate::loop_heartbeats::LoopHeartbeats;
use crate::order_reconciler::OrderReconciler;
use crate::startup::build_pager::build_pager;
use crate::startup::kinovi_setup::{get_kinovi_session, get_kinovi_version};

pub mod alert_on_error;
pub mod http_server;
pub mod job_dependencies;
pub mod jobs;
pub mod kinovi_version;
pub mod loop_heartbeats;
pub mod order_reconciler;
pub mod startup;
pub mod with_deadline;

// Bucket config
const ENV_ACCESS_KEY: &str = "ACCESS_KEY";
const ENV_SECRET_KEY: &str = "SECRET_KEY";
const ENV_REGION_NAME: &str = "REGION_NAME";
const ENV_PUBLIC_BUCKET_NAME: &str = "PUBLIC_BUCKET_NAME";
const ENV_S3_ENDPOINT: &str = "S3_COMPATIBLE_ENDPOINT_URL";

const ENV_MAX_JOB_AGE_THRESHOLD_HOURS: &str = "MAX_JOB_AGE_THRESHOLD_HOURS";

/// Bound on acquiring a pooled MySQL connection (the query itself is bounded
/// separately by `with_deadline`).
const MYSQL_ACQUIRE_TIMEOUT: Duration = Duration::from_secs(10);

/// Recycle idle MySQL connections well inside any middlebox idle cutoff so a
/// silently-dropped socket is far less likely to be handed to a query.
const MYSQL_IDLE_TIMEOUT: Duration = Duration::from_secs(5 * 60);

/// Deadline for a single media download from Kinovi's CDN.
const DOWNLOAD_TIMEOUT: Duration = Duration::from_secs(5 * 60);

/// How long to wait for the remaining loops to wind down once one has exited.
const LOOP_SHUTDOWN_GRACE: Duration = Duration::from_secs(30);

#[tokio::main]
async fn main() -> AnyhowResult<()> {

  let container_environment = bootstrap(BootstrapArgs {
    app_name: "seedance2-pro-job",
    default_logging_override: Some(DEFAULT_RUST_LOG),
    config_search_directories: &[".", "./config", "crates/service/job/seedance2_pro_job/config"],
    ignore_legacy_dot_env_file: true,
  })?;

  info!("Hostname: {}", &container_environment.hostname);

  let _k8s_node_name = easyenv::get_env_string_optional("K8S_NODE_NAME");
  let _k8s_pod_name = easyenv::get_env_string_optional("K8S_POD_NAME");

  let db_connection_string = env_get_mysql_connection_string_or_default();

  info!("Connecting to database...");

  let mysql_pool = MySqlPoolOptions::new()
    .max_connections(2)
    .acquire_timeout(MYSQL_ACQUIRE_TIMEOUT)
    .idle_timeout(Some(MYSQL_IDLE_TIMEOUT))
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

  let public_bucket_client = LegacyBucketClient::create(
    &access_key,
    &secret_key,
    &region_name,
    &public_bucket_name,
    &s3_compatible_endpoint_url,
    None,
    Some(bucket_timeout),
  )?;

  let download_client = reqwest::Client::builder()
    .timeout(DOWNLOAD_TIMEOUT)
    .build()?;

  let kinovi_version = get_kinovi_version()?;
  let kinovi_session = get_kinovi_session(kinovi_version)?;

  // How often to poll for results (default: 15 seconds)
  let poll_interval_millis: u64 = easyenv::get_env_num(
    "SEEDANCE_POLL_INTERVAL_MILLIS",
    5_000,
  )?;

  let maybe_max_job_age = easyenv::try_get_env_num_optional::<i64>(ENV_MAX_JOB_AGE_THRESHOLD_HOURS)?
      .and_then(chrono::Duration::try_hours);

  if let Some(ref duration) = maybe_max_job_age {
    info!("Max job age threshold: {} hours", duration.num_hours());
  }

  let poll_max_retries: u32 = easyenv::get_env_num(
    "POLL_MAX_RETRIES",
    3,
  )?;

  let poll_retry_max_delay_millis: u64 = easyenv::get_env_num(
    "POLL_RETRY_MAX_DELAY_MILLIS",
    10_000,
  )?;

  info!("Poll max retries: {}, max retry delay: {}ms", poll_max_retries, poll_retry_max_delay_millis);

  let credits_alert_threshold: u64 = easyenv::get_env_num(
    "CREDITS_ALERT_THRESHOLD",
    10_000,
  )?;

  info!("Credits alert threshold: {}", credits_alert_threshold);

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
  let shutdown_notify = Arc::new(Notify::new());
  let job_stats = JobStats::new();

  // Shared hand-off between the polling loop (producer) and processing loop (consumer).
  let order_reconciler = OrderReconciler::new();

  // Liveness signal from every loop, read by the health check.
  let heartbeats = LoopHeartbeats::new();

  let pager_for_shutdown = pager.clone();

  let create_server_args = CreateServerArgs {
    container_environment: container_environment.clone(),
    job_stats: job_stats.clone(),
    heartbeats: heartbeats.clone(),
    pager: pager.clone(),
  };

  let job_dependencies = JobDependencies {
    mysql_pool,
    public_bucket_client,
    download_client,
    kinovi_web_session: kinovi_session,
    kinovi_version,
    server_environment,
    job_stats,
    poll_interval_millis,
    maybe_max_job_age,
    poll_max_retries,
    poll_retry_max_delay_millis,
    credits_alert_threshold,
    application_shutdown: application_shutdown.clone(),
    shutdown_notify: shutdown_notify.clone(),
    pager,
    order_reconciler,
    heartbeats,
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

  // Spawn all loops as concurrent tasks. Order polling (producer) and order
  // processing (consumer) run independently and hand off via the reconciler.
  let polling_deps = job_dependencies.clone();
  let processing_deps = job_dependencies.clone();
  let credits_deps = job_dependencies.clone();

  let polling_handle = tokio::spawn(async move {
    order_polling_main_loop(polling_deps).await;
  });

  let processing_handle = tokio::spawn(async move {
    order_processing_main_loop(processing_deps).await;
  });

  let credits_handle = tokio::spawn(async move {
    credits_checking_main_loop(credits_deps).await;
  });

  let maybe_character_handle = if kinovi_version.has_characters() {
    let character_deps = job_dependencies;
    Some(tokio::spawn(async move {
      character_polling_main_loop(character_deps).await;
    }))
  } else {
    // skip character polling entirely.
    info!("Alternate mode: character polling is disabled.");
    None
  };

  // Wait for the FIRST loop to exit. If shutdown wasn't requested, that loop
  // died (panicked, or returned unexpectedly) and the job is silently crippled
  // — the other loops would happily keep the process alive forever. Fail fast
  // so Kubernetes restarts us instead.
  let mut polling_handle = polling_handle;
  let mut processing_handle = processing_handle;
  let mut credits_handle = credits_handle;
  let mut character_handle = maybe_character_handle;

  let (first_exited, first_result) = tokio::select! {
    result = &mut polling_handle => ("order polling", result),
    result = &mut processing_handle => ("order processing", result),
    result = &mut credits_handle => ("credits checking", result),
    result = async {
      match character_handle.as_mut() {
        Some(handle) => handle.await,
        None => std::future::pending().await,
      }
    } => ("character polling", result),
  };

  let was_shutdown_requested = application_shutdown.get();

  if let Err(join_err) = &first_result {
    error!("The {} loop panicked or was cancelled: {:?}", first_exited, join_err);
  } else if !was_shutdown_requested {
    error!("The {} loop exited without a shutdown request.", first_exited);
  } else {
    info!("The {} loop exited after shutdown request.", first_exited);
  }

  // Make sure the remaining loops wind down, then give them a bounded grace period.
  application_shutdown.set(true);
  shutdown_notify.notify_waiters();

  let remaining = async {
    let _ = polling_handle.await;
    let _ = processing_handle.await;
    let _ = credits_handle.await;
    if let Some(handle) = character_handle {
      let _ = handle.await;
    }
  };

  if tokio::time::timeout(LOOP_SHUTDOWN_GRACE, remaining).await.is_err() {
    warn!("Remaining loops did not exit within {}s; exiting anyway.", LOOP_SHUTDOWN_GRACE.as_secs());
  }

  info!("Shutting down pager worker...");
  pager_for_shutdown.shutdown_worker();

  info!("KinoviWeb job exiting.");

  if first_result.is_err() || !was_shutdown_requested {
    return Err(anyhow!("{} loop terminated unexpectedly; exiting so the pod restarts", first_exited));
  }

  Ok(())
}

