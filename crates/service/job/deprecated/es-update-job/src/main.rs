// Never allow these
#![forbid(private_bounds)]
#![forbid(private_interfaces)]
#![forbid(unused_must_use)] // NB: It's unsafe to not close/check some things

// Okay to toggle
#![forbid(unreachable_patterns)]
#![forbid(unused_imports)]
#![forbid(unused_mut)]
#![forbid(unused_variables)]

// Always allow
#![allow(dead_code)]
#![allow(non_snake_case)]

// Strict
//#![forbid(warnings)]

use std::sync::Arc;

use elasticsearch::Elasticsearch;
use elasticsearch::http::transport::Transport;
use log::info;
use sqlx::{MySql, Pool};
use sqlx::mysql::MySqlPoolOptions;

use bootstrap::bootstrap::{bootstrap, BootstrapArgs};
use shared_env_var_config::logging::DEFAULT_RUST_LOG;
use shared_env_var_config::mysql::env_get_mysql_connection_string_or_default;
use errors::AnyhowResult;

use crate::job_state::{JobState, SleepConfigs};
use crate::tasks::model_weights::update_all_model_weights::update_all_model_weights;
use crate::tasks::model_weights::update_recently_written_model_weights::update_recently_written_model_weights;
use crate::tasks::update_engine_media_files::update_engine_media_files::update_engine_media_files;

pub mod job_state;
pub mod tasks;

#[tokio::main]
async fn main() -> AnyhowResult<()> {

  let container_environment = bootstrap(BootstrapArgs {
    app_name: "es-update-job",
    default_logging_override: Some(DEFAULT_RUST_LOG),
    config_search_directories: &[".", "./config", "crates/service/job/deprecated/es-update-job/config"],
    ignore_legacy_dot_env_file: true,
  })?;

  info!("Hostname: {}", &container_environment.hostname);

  let mysql_pool = get_mysql_pool().await?;
  let elasticsearch = get_elasticsearch_client()?;

  let job_state = Arc::new(JobState {
    mysql_pool,
    elasticsearch,
    sleep_config: SleepConfigs {
      between_es_writes_wait_millis: easyenv::get_env_num("BETWEEN_WRITES_WAIT_MILLIS", 100)?,
      between_job_batch_wait_millis: easyenv::get_env_num("BETWEEN_JOB_BATCH_WAIT_MILLIS", 500)?,
      between_query_wait_millis: easyenv::get_env_num("BETWEEN_QUERY_WAIT_MILLIS", 100)?,
      between_error_wait_millis: easyenv::get_env_num("BETWEEN_ERROR_WAIT_MILLIS", 10_000)?,
      between_no_updates_wait_millis: easyenv::get_env_num("BETWEEN_NO_UPDATES_WAIT_MILLIS", 20_000)?,
    },
  });

  info!("Starting thread to update recently updated model weights...");

  let job_state_1 = job_state.clone();

  let handle_1 = tokio::task::spawn(async move {
    let _r = update_recently_written_model_weights(job_state_1).await;
  });

  info!("Starting thread to update all model weights...");

  let job_state_2 = job_state.clone();

  let handle_2 = tokio::task::spawn(async move {
    let _r = update_all_model_weights(job_state_2).await;
  });

  info!("Starting thread to update engine media files...");

  let job_state_3 = job_state.clone();

  let handle_3 = tokio::task::spawn(async move {
    let _r = update_engine_media_files(job_state_3).await;
  });

  futures::future::join_all([
    handle_1,
    handle_2,
    handle_3,
  ]).await;

  Ok(())
}

async fn get_mysql_pool() -> AnyhowResult<Pool<MySql>> {
  info!("Connecting to MySQL database...");

  let db_connection_string = env_get_mysql_connection_string_or_default();

  let mysql_pool = MySqlPoolOptions::new()
      .max_connections(5)
      .connect(&db_connection_string)
      .await?;

  Ok(mysql_pool)
}

fn get_elasticsearch_client() -> AnyhowResult<Elasticsearch> {
  info!("Connecting to Elasticsearch...");
  let transport = Transport::single_node(&easyenv::get_env_string_required("ELASTICSEARCH_URL")?)?;

  // TODO(bt,2023-10-26): Allow connecting to instances by URL instead of the default dev URL.
  Ok(Elasticsearch::new(transport))
}
