// ----- Constants -----

const ENV_REDIS_0_URL: &str = "REDIS_0_URL";
const ENV_REDIS_1_URL: &str = "REDIS_1_URL";

/// The default Redis connection string for use in development (database 0)
const DEFAULT_REDIS_DATABASE_0_CONNECTION_STRING: &str = "redis://localhost/0";

/// The default Redis connection string for use in development (database 1)
const DEFAULT_REDIS_DATABASE_1_CONNECTION_STRING: &str = "redis://localhost/1";

// ----- Read Environment Variables -----

pub fn env_get_redis_0_connection_string_or_default() -> String {
  easyenv::get_env_string_or_default(ENV_REDIS_0_URL, DEFAULT_REDIS_DATABASE_0_CONNECTION_STRING)
}

pub fn env_get_redis_1_connection_string_or_default() -> String {
  easyenv::get_env_string_or_default(ENV_REDIS_1_URL, DEFAULT_REDIS_DATABASE_1_CONNECTION_STRING)
}
