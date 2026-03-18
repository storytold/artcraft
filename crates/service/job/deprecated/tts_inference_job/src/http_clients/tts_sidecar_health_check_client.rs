use std::str::FromStr;

use log::info;
use reqwest::{Client, Url};

use errors::AnyhowResult;

// TODO(bt): As more microservices adopt a common health check protocol,
// it may make sense to make this a common library.

/// Standard "health check" endpoint response.
#[derive(Deserialize)]
pub struct HealthCheckResponse {
  pub success: bool,
  pub is_healthy: bool,
}

pub enum HealthState {
  Healthy,
  Unhealthy,
}

pub struct TtsSidecarHealthCheckClient {
  // NB: includes port
  hostname: String,
  health_check_url: Url,
}

impl TtsSidecarHealthCheckClient {
  pub fn new(hostname: &str) -> AnyhowResult<Self> {
    // TODO(bt): Why don't have have a cached HTTP client here? Did it get poisoned?
    //let client = Client::builder()
    //    .header("User-Agent", "actix/tts_inference_job")
    //    .finish();

    let health_check_url = format!("http://{}/_status", hostname);
    let health_check_url = Url::from_str(&health_check_url)?;

    Ok(Self {
      hostname: hostname.to_string(),
      health_check_url,
      //  client,
    })
  }

  pub async fn request_health_check(&self) -> AnyhowResult<HealthState> {
    info!("Requesting {}", &self.health_check_url);

    let client = Client::new();

    let response = client.get(self.health_check_url.clone())
        .send()
        .await?;

    let response_body = response.text().await?;

    let response_json = serde_json::from_str::<HealthCheckResponse>(&response_body)?;

    let status = if response_json.success && response_json.is_healthy {
      HealthState::Healthy
    } else {
      HealthState::Unhealthy
    };

    Ok(status)
  }
}
