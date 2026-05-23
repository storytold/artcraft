use errors::{anyhow, AnyhowResult};
use server_environment::ServerEnvironment;

#[derive(Clone)]
pub struct EnvArgs {
  // Actix server parameters
  pub bind_address: String,
  pub num_workers: usize,
  pub enable_gzip: bool,
  pub server_environment: ServerEnvironment,

  // Feature flags (compatible with storyteller-web; see storyteller-web for documentation)
  pub maybe_status_alert_category: Option<String>, // During outage, predefined category for user alerts
  pub maybe_status_alert_custom_message: Option<String>, // During outage, custom text for user alerts
}

pub fn env_args() -> AnyhowResult<EnvArgs> {
  let bind_address = easyenv::get_env_string_or_default("BIND_ADDRESS", "0.0.0.0:12345");
  let num_workers = easyenv::get_env_num("NUM_WORKERS", 8)?;

  let enable_gzip = easyenv::get_env_num("ENABLE_GZIP", false)?;

  let server_environment = ServerEnvironment::from_str(
    &easyenv::get_env_string_required("SERVER_ENVIRONMENT")?)
      .ok_or(anyhow!("invalid server environment"))?;

  let maybe_status_alert_category =  easyenv::get_env_string_optional("FF_STATUS_ALERT_CATEGORY");
  let maybe_status_alert_custom_message =  easyenv::get_env_string_optional("FF_STATUS_ALERT_CUSTOM_MESSAGE");

  Ok(EnvArgs {
    bind_address,
    num_workers,
    enable_gzip,
    server_environment,
    maybe_status_alert_category,
    maybe_status_alert_custom_message,
  })
}
