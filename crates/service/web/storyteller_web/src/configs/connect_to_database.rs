use errors::AnyhowResult;
use shared_env_var_config::mysql::env_get_mysql_connection_string_or_default;
use sqlx::mysql::MySqlPoolOptions;
use sqlx::MySqlPool;

pub async fn connect_to_database() -> AnyhowResult<MySqlPool>{
  let db_connection_string = env_get_mysql_connection_string_or_default();

  let pool_options = MySqlPoolOptions::new()
      .max_connections(easyenv::get_env_num("MYSQL_MAX_CONNECTIONS", 5)?);

  // TODO(bt,2024-09-17): Configure logging, etc. after we've upgraded sqlx

  let pool = pool_options
      .connect(&db_connection_string)
      .await?;

  Ok(pool)
}
