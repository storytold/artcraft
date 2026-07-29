use std::time::Duration;

use log::info;

use errors::AnyhowResult;
use shared_env_var_config::mysql::env_get_mysql_connection_string_or_default;
use sqlx::mysql::MySqlPoolOptions;
use sqlx::MySqlPool;

pub async fn connect_to_database() -> AnyhowResult<MySqlPool> {
  let db_connection_string = env_get_mysql_connection_string_or_default();

  // NB: The managed DB's connection ceiling is far above what we use, so the binding
  // constraint is this per-pod pool. Keep `replicas * MYSQL_MAX_CONNECTIONS` (plus the
  // background jobs' small pools) comfortably under the server's `max_connections`.
  let max_connections = easyenv::get_env_num("MYSQL_MAX_CONNECTIONS", 20)?;
  let min_connections = easyenv::get_env_num("MYSQL_MIN_CONNECTIONS", 0)?;

  // NB: Fail fast under pool saturation rather than stacking up on sqlx's 30s default — a
  // shorter timeout sheds load and surfaces the problem instead of hiding it behind long waits.
  let acquire_timeout_seconds = easyenv::get_env_num::<u64>("MYSQL_ACQUIRE_TIMEOUT_SECONDS", 10)?;

  // NB: Log the settings before building/connecting so a connect failure has context. We do NOT
  // log the connection string (it contains credentials).
  info!(
    "Building MySQL pool: max_connections={}, min_connections={}, acquire_timeout_seconds={}",
    max_connections, min_connections, acquire_timeout_seconds,
  );

  let pool_options = MySqlPoolOptions::new()
      .max_connections(max_connections)
      .min_connections(min_connections)
      .acquire_timeout(Duration::from_secs(acquire_timeout_seconds));

  let pool = pool_options
      .connect(&db_connection_string)
      .await?;

  Ok(pool)
}
