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

use anyhow::anyhow;
use log::{info, warn};
use r2d2_redis::r2d2;
use r2d2_redis::RedisConnectionManager;
use sqlx::mysql::MySqlPoolOptions;

use bootstrap::bootstrap::{bootstrap, BootstrapArgs};
use concurrency::relaxed_atomic_bool::RelaxedAtomicBool;
use config::common_env::CommonEnv;
use config::shared_constants::DEFAULT_MYSQL_CONNECTION_STRING;
use config::shared_constants::DEFAULT_RUST_LOG;
use email_sender::smtp_email_sender::SmtpEmailSender;
use errors::AnyhowResult;
use jobs_common::job_progress_reporter::job_progress_reporter::JobProgressReporterBuilder;
use jobs_common::job_progress_reporter::noop_job_progress_reporter::NoOpJobProgressReporterBuilder;
use jobs_common::job_progress_reporter::redis_job_progress_reporter::RedisJobProgressReporterBuilder;
use jobs_common::job_stats::JobStats;
use mysql_queries::common_inputs::container_environment_arg::ContainerEnvironmentArg;
use server_environment::ServerEnvironment;

use crate::http_server::run_http_server::CreateServerArgs;
use crate::http_server::run_http_server::launch_http_server;
use crate::job::job_loop::main_loop::main_loop;
use crate::job_dependencies::{FileSystemDetails, JobDependencies, JobWorkerDetails};

pub mod http_server;
pub mod job;
pub mod job_dependencies;

#[actix_web::main]
async fn main() -> AnyhowResult<()> {

  let container_environment = bootstrap(BootstrapArgs {
    app_name: "email-sender-job",
    default_logging_override: Some(DEFAULT_RUST_LOG),
    config_search_directories: &[".", "./config", "crates/service/job/deprecated/email_sender_job/config"],
    ignore_legacy_dot_env_file: false,
  })?;

  info!("Hostname: {}", &container_environment.hostname);

  // NB: These are non-standard env vars we're injecting ourselves.
  let _k8s_node_name = easyenv::get_env_string_optional("K8S_NODE_NAME");
  let _k8s_pod_name = easyenv::get_env_string_optional("K8S_POD_NAME");

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

  // Set to "0" to always treat low priority the same as high priority
  let low_priority_starvation_prevention_every_nth= easyenv::get_env_num(
    "LOW_PRIORITY_STARVATION_PREVENTION_EVERY_NTH", 3)?;

  let server_environment = ServerEnvironment::from_str(&easyenv::get_env_string_required("SERVER_ENVIRONMENT")?)
      .ok_or(anyhow!("invalid server environment"))?;

  let email_sender = SmtpEmailSender::new(
    &easyenv::get_env_string_required("SMTP_RELAY")?,
    easyenv::get_env_string_required("SMTP_USERNAME")?,
    easyenv::get_env_string_required("SMTP_PASSWORD")?,
  )?;

  let is_debug_worker = easyenv::get_env_bool_or_default("IS_DEBUG_WORKER", false);

  info!("Is debug worker? {}", is_debug_worker);

  // Optionally report job progress to the user via Redis (for now)
  // We want to turn this off in the on-premises workers since we're not tunneling to the production Redis.
  let job_progress_reporter : Box<dyn JobProgressReporterBuilder>
      = match easyenv::get_env_string_optional("REDIS_FOR_JOB_PROGRESS")
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

  let maybe_keepalive_redis_pool =
      match easyenv::get_env_string_optional("REDIS_FOR_KEEPALIVE_URL") {
        None => None,
        Some(redis_url) => {
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

  let job_dependencies = JobDependencies {
    fs: FileSystemDetails {
      maybe_pause_file: easyenv::get_env_pathbuf_optional("PAUSE_FILE"),
    },
    mysql_pool,
    maybe_redis_pool: None, // TODO(bt, 2023-01-11): See note in JobDependencies
    maybe_keepalive_redis_pool,
    job_progress_reporter,
    job_stats,
    worker_details: JobWorkerDetails {
      is_debug_worker,
    },
    server_environment,
    email_sender,
    job_batch_wait_millis: common_env.job_batch_wait_millis,
    job_max_attempts: common_env.job_max_attempts as u16,
    job_batch_size: common_env.job_batch_size,
    no_op_logger_millis: common_env.no_op_logger_millis,
    low_priority_starvation_prevention_every_nth,
    container: container_environment.clone(),
    container_db: ContainerEnvironmentArg {
      hostname: container_environment.hostname,
      cluster_name: container_environment.cluster_name,
    },
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
