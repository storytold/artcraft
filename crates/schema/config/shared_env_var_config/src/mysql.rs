// ----- Constants -----

const ENV_MYSQL_URL: &str = "MYSQL_URL";

/// The default MySql connection string for use in development
const DEFAULT_MYSQL_CONNECTION_STRING: &str = "mysql://storyteller:password@localhost/storyteller";

// ----- Read Environment Variables -----

pub fn env_get_mysql_connection_string_or_default() -> String {
  easyenv::get_env_string_or_default(ENV_MYSQL_URL, DEFAULT_MYSQL_CONNECTION_STRING)
}
