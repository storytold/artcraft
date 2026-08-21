// Never allow these
#![forbid(private_bounds)]
#![forbid(private_interfaces)]
#![forbid(unused_must_use)]

// Always allow
#![allow(dead_code)]
#![allow(non_snake_case)]

#[macro_use] extern crate serde_derive;

use std::time::Duration;

use anyhow::anyhow;
use chrono::NaiveDate;
use log::{info, warn};
use sqlx::mysql::MySqlPoolOptions;
use sqlx::Executor;

use bootstrap::bootstrap::{bootstrap, BootstrapArgs};
use concurrency::relaxed_atomic_bool::RelaxedAtomicBool;
use errors::AnyhowResult;
use jobs_common::job_stats::JobStats;
use server_environment::ServerEnvironment;
use shared_env_var_config::logging::DEFAULT_RUST_LOG;
use shared_env_var_config::mysql::env_get_mysql_connection_string_or_default;
use tokio::signal::unix::{signal, SignalKind};

use crate::http_server::run_http_server::{launch_http_server, CreateServerArgs};
use crate::job::main_loop::main_loop;
use crate::job_dependencies::{JobDependencies, ReengagementConfig};
use crate::startup::build_pager::build_pager;

pub mod http_server;
pub mod job;
pub mod job_dependencies;
pub mod startup;

#[tokio::main]
async fn main() -> AnyhowResult<()> {
  let container_environment = bootstrap(BootstrapArgs {
    app_name: "user-spend-analytics-job",
    default_logging_override: Some(DEFAULT_RUST_LOG),
    config_search_directories: &[".", "./config", "crates/service/job/user_spend_analytics_job/config"],
    ignore_legacy_dot_env_file: true,
  })?;

  info!("Hostname: {}", &container_environment.hostname);

  let _k8s_node_name = easyenv::get_env_string_optional("K8S_NODE_NAME");
  let _k8s_pod_name = easyenv::get_env_string_optional("K8S_POD_NAME");

  let db_connection_string = env_get_mysql_connection_string_or_default();

  info!("Connecting to database...");

  // Low connection ceiling + a UTC session so day/week bucketing is deterministic.
  let mysql_pool = MySqlPoolOptions::new()
    .max_connections(2)
    .after_connect(|conn, _meta| {
      Box::pin(async move {
        conn.execute("SET time_zone = '+00:00'").await?;
        Ok(())
      })
    })
    .connect(&db_connection_string)
    .await?;

  info!("Connected to MySQL.");

  let server_environment = ServerEnvironment::from_str(
    &easyenv::get_env_string_required("SERVER_ENVIRONMENT")?,
  )
    .ok_or(anyhow!("invalid server environment"))?;

  // ---- Job timing / throttling ----
  let sleep_between_cycles = easyenv::get_env_duration_seconds_or_default(
    "SLEEP_BETWEEN_CYCLES_SECONDS",
    Duration::from_secs(60 * 60 * 24), // daily
  );
  let query_delay = Duration::from_millis(easyenv::get_env_num("QUERY_DELAY_MILLIS", 50)?);
  let error_recovery = easyenv::get_env_duration_seconds_or_default(
    "ERROR_RECOVERY_SECONDS",
    Duration::from_secs(30),
  );
  let summary_user_page_size: i64 = easyenv::get_env_num("SUMMARY_USER_PAGE_SIZE", 500)?;

  // ---- Daily-spends backfill window ----
  let maybe_backfill_start_date: Option<NaiveDate> = easyenv::get_env_string_optional("BACKFILL_START_DATE")
    .and_then(|s| NaiveDate::parse_from_str(s.trim(), "%Y-%m-%d").ok());
  let maybe_backfill_days: Option<i64> = easyenv::get_env_string_optional("BACKFILL_DAYS")
    .and_then(|s| s.trim().parse().ok());

  // ---- Reengagement score tunables ----
  let reengagement = ReengagementConfig {
    value_cap_dollars: easyenv::get_env_string_optional("REENGAGEMENT_VALUE_CAP_DOLLARS")
      .and_then(|s| s.trim().parse().ok())
      .unwrap_or(1000.0),
    active_threshold_days: easyenv::get_env_num("REENGAGEMENT_ACTIVE_THRESHOLD_DAYS", 14)?,
    decay_days: easyenv::get_env_string_optional("REENGAGEMENT_DECAY_DAYS")
      .and_then(|s| s.trim().parse().ok())
      .unwrap_or(350.0),
  };

  let (pager, pager_worker) = build_pager(server_environment, &container_environment.hostname);

  info!("Spawning pager worker.");

  // The pager worker uses a blocking Condvar::wait(); it must run on a dedicated OS thread.
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
    server_environment,
    job_stats,
    sleep_between_cycles,
    query_delay,
    error_recovery,
    maybe_backfill_start_date,
    maybe_backfill_days,
    summary_user_page_size,
    reengagement,
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

  // Listen for SIGTERM (k8s pod termination) and SIGINT (Ctrl-C) to trigger
  // graceful shutdown of the main loop.
  let application_shutdown_for_signal = application_shutdown.clone();
  tokio::spawn(async move {
    let mut sigterm = match signal(SignalKind::terminate()) {
      Ok(stream) => stream,
      Err(err) => {
        warn!("Failed to install SIGTERM handler: {:?}", err);
        return;
      }
    };
    let mut sigint = match signal(SignalKind::interrupt()) {
      Ok(stream) => stream,
      Err(err) => {
        warn!("Failed to install SIGINT handler: {:?}", err);
        return;
      }
    };
    tokio::select! {
      _ = sigterm.recv() => info!("Received SIGTERM. Shutting down..."),
      _ = sigint.recv() => info!("Received SIGINT. Shutting down..."),
    }
    application_shutdown_for_signal.set(true);
  });

  main_loop(job_dependencies).await;

  info!("Shutting down pager worker...");
  pager_for_shutdown.shutdown_worker();

  info!("User spend analytics job exiting.");

  Ok(())
}
