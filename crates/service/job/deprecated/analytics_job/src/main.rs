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

use log::info;
use sqlx::{MySql, Pool};
use sqlx::mysql::MySqlPoolOptions;

use config::shared_constants::DEFAULT_MYSQL_CONNECTION_STRING;
use config::shared_constants::DEFAULT_RUST_LOG;
use errors::AnyhowResult;

use crate::job_state::{JobState, SleepConfigs};
use crate::tasks::update_model_usage_counts_table::update_model_usage_counts_table::update_model_usage_counts_table;
use crate::tasks::update_model_weights_cached_usage_field::update_model_weights_cached_usage_field::update_model_weights_cached_usage_field;

pub mod job_state;
pub mod tasks;

#[tokio::main]
async fn main() -> AnyhowResult<()> {
  easyenv::init_all_with_default_logging(Some(DEFAULT_RUST_LOG));

  let _ = dotenv::from_filename(".env-analytics-job").ok(); // NB: Specific to `analytics-job` app.
  //let _ = dotenv::from_filename(".env-secrets").ok(); // NB: Secrets not to live in source control.

  info!("Obtaining hostname...");

  let server_hostname = hostname::get()
      .ok()
      .and_then(|h| h.into_string().ok())
      .unwrap_or("analytics-job".to_string());

  info!("Hostname: {}", &server_hostname);

  let mysql_pool = get_mysql_pool().await?;

  let job_state = JobState {
    mysql_pool,
    sleep_config: SleepConfigs {
      between_job_wait_millis: easyenv::get_env_num("BETWEEN_JOB_WAIT_MILLIS", 100)?,
      between_job_batch_wait_millis: easyenv::get_env_num("BETWEEN_JOB_BATCH_WAIT_MILLIS", 5000)?,
      between_query_wait_millis: easyenv::get_env_num("BETWEEN_QUERY_WAIT_MILLIS", 100)?,
      between_error_wait_millis: easyenv::get_env_num("BETWEEN_ERROR_WAIT_MILLIS", 10_000)?,
    },
  };

  let job_state_1 = job_state.clone();

  let handle_1 = tokio::task::spawn(async move {
    let _r = update_model_usage_counts_table(job_state_1).await;
  });

  let job_state_2 = job_state.clone();

  let handle_2 = tokio::task::spawn(async move {
    let _r = update_model_weights_cached_usage_field(job_state_2).await;
  });

  futures::future::join_all([
    handle_1,
    handle_2,
  ]).await;

  Ok(())
}

async fn get_mysql_pool() -> AnyhowResult<Pool<MySql>> {
  info!("Connecting to MySQL database...");

  let db_connection_string =
      easyenv::get_env_string_or_default(
        "MYSQL_URL",
        DEFAULT_MYSQL_CONNECTION_STRING);

  let mysql_pool = MySqlPoolOptions::new()
      .max_connections(5)
      .connect(&db_connection_string)
      .await?;

  Ok(mysql_pool)
}
