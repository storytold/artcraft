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
use log::{info, warn};
use sqlx::mysql::MySqlPoolOptions;

use bootstrap::bootstrap::{bootstrap, BootstrapArgs};
use cloud_storage::bucket_client::BucketClient;
use concurrency::relaxed_atomic_bool::RelaxedAtomicBool;
use config::shared_constants::DEFAULT_MYSQL_CONNECTION_STRING;
use config::shared_constants::DEFAULT_RUST_LOG;
use errors::AnyhowResult;
use jobs_common::job_stats::JobStats;
use seedance2pro::creds::seedance2pro_session::Seedance2ProSession;
use server_environment::ServerEnvironment;

use crate::http_server::run_http_server::{launch_http_server, CreateServerArgs};
use crate::main_loop::main_loop;
use crate::job_dependencies::JobDependencies;

pub mod http_server;
pub mod job_dependencies;
pub mod main_loop;
pub mod process_job;

// Bucket config
const ENV_ACCESS_KEY: &str = "ACCESS_KEY";
const ENV_SECRET_KEY: &str = "SECRET_KEY";
const ENV_REGION_NAME: &str = "REGION_NAME";
const ENV_PUBLIC_BUCKET_NAME: &str = "PUBLIC_BUCKET_NAME";
const ENV_S3_ENDPOINT: &str = "S3_COMPATIBLE_ENDPOINT_URL";
const ENV_SEEDANCE2PRO_COOKIES : &str = "SEEDANCE2PRO_COOKIES";

#[actix_web::main]
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

  // Seedance2Pro session from cookie string
  let seedance2pro_cookies = easyenv::get_env_string_required(ENV_SEEDANCE2PRO_COOKIES)?;
  let seedance2pro_session = Seedance2ProSession::from_cookies_string(seedance2pro_cookies);

  // How often to poll for results (default: 15 seconds)
  let poll_interval_millis: u64 = easyenv::get_env_num(
    "SEEDANCE_POLL_INTERVAL_MILLIS",
    5_000,
  )?;

  let application_shutdown = RelaxedAtomicBool::new(false);
  let job_stats = JobStats::new();

  let create_server_args = CreateServerArgs {
    container_environment: container_environment.clone(),
    job_stats: job_stats.clone(),
  };

  let job_dependencies = JobDependencies {
    mysql_pool,
    public_bucket_client,
    seedance2pro_session,
    server_environment,
    job_stats,
    poll_interval_millis,
    application_shutdown: application_shutdown.clone(),
  };

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
