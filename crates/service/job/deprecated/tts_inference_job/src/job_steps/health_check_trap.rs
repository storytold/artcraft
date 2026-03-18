use std::cmp::min;
use std::time::Duration;

use log::{error, info};

use crate::http_clients::tts_sidecar_health_check_client::HealthState;
use crate::http_clients::tts_sidecar_health_check_client::TtsSidecarHealthCheckClient;

// Health check timeouts
const HEALTH_CHECK_START_TIMEOUT_MILLIS : u64 = 250;
const HEALTH_CHECK_INCREASE_TIMEOUT_MILLIS : u64 = 250;
const HEALTH_CHECK_MAX_TIMEOUT_MILLIS : u64 = 5000;

pub async fn maybe_block_on_sidecar_health_check(
  tts_sidecar_health_check_client: &TtsSidecarHealthCheckClient
) {
  let mut error_timeout_millis = HEALTH_CHECK_START_TIMEOUT_MILLIS;

  loop {
    info!("Performing sidecar health check...");
    let maybe_health =
        tts_sidecar_health_check_client.request_health_check().await;

    match maybe_health {
      Ok(HealthState::Healthy) => {
        return;
      }
      Ok(HealthState::Unhealthy) => {
        error!("Sidecar health is reported as UNHEALTHY!");
        error_timeout_millis = increase_timeout(error_timeout_millis);
      }
      Err(err) => {
        // NB: If we fail
        error!("Sidecar health check failed for reason: {:?}", err);
        error_timeout_millis = increase_timeout(error_timeout_millis);
      }
    }

    std::thread::sleep(Duration::from_millis(error_timeout_millis));
  }
}

fn increase_timeout(current_timeout: u64) -> u64 {
  let next_timeout = current_timeout + HEALTH_CHECK_INCREASE_TIMEOUT_MILLIS;
  min(next_timeout, HEALTH_CHECK_MAX_TIMEOUT_MILLIS)
}
