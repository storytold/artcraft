// ----- Environment Variable Names -----

const ENV_DATADOG_API_KEY: &str = "DATADOG_API_KEY";
const ENV_ENABLE_METRICS: &str = "ENABLE_METRICS";

// ----- Read Environment Variables -----

pub fn env_optional_datadog_api_key() -> Option<String> {
  easyenv::get_env_string_optional(ENV_DATADOG_API_KEY)
}

/// Independent of API key presence — lets ops kill metrics at runtime
/// without removing the secret.
pub fn env_enable_metrics_default_false() -> bool {
  easyenv::get_env_bool_or_default(ENV_ENABLE_METRICS, false)
}
