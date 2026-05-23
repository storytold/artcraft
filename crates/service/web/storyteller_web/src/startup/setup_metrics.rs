use log::{info, warn};

use datadog_client::client::DatadogClient;
use datadog_client::creds::DatadogApiKey;
use metrics::builder::MetricsBuilder;
use metrics::collector::MetricsCollector;
use metrics::worker::MetricsWorker;
use shared_env_var_config::metrics::{env_enable_metrics_default_false, env_optional_datadog_api_key};

/// Returns `(collector, Option<worker>)`. When metrics are disabled or no
/// API key is set, returns a noop collector and no worker — wire the
/// collector into the middleware unconditionally so the request path
/// stays identical in both modes. Callers that want a graceful shutdown
/// drain can grab `worker.shutdown_handle()` before spawning the worker.
pub fn build_metrics(
  server_environment: server_environment::ServerEnvironment,
  hostname: &str,
) -> (MetricsCollector, Option<MetricsWorker>) {
  // Loud-on-purpose: silence in the logs after deploy is the most common
  // way "metrics aren't showing up" goes unnoticed. Make the disabled-state
  // unmistakable in every env.
  let env_label = if server_environment.is_deployed_in_production() {
    "production"
  } else {
    "development"
  };

  if !env_enable_metrics_default_false() {
    warn!(
      "METRICS DISABLED: ENABLE_METRICS=false (or unset) — no Datadog metrics \
       will be reported (env={}, host={}). Set ENABLE_METRICS=true to enable.",
      env_label, hostname,
    );
    return (MetricsCollector::noop(), None);
  }

  let Some(api_key) = env_optional_datadog_api_key() else {
    warn!(
      "METRICS DISABLED: ENABLE_METRICS=true but DATADOG_API_KEY is not set \
       (env={}, host={}). Set DATADOG_API_KEY to enable submission.",
      env_label, hostname,
    );
    return (MetricsCollector::noop(), None);
  };

  let client = DatadogClient::new(DatadogApiKey::new(api_key));

  let build = MetricsBuilder::new()
    .datadog_client(client)
    .service_name("storyteller-web")
    .env(env_label)
    .host(hostname)
    .build();

  match build {
    Ok(out) => {
      info!(
        "Metrics worker configured (service=storyteller-web, env={}, host={})",
        env_label, hostname,
      );
      (out.collector, Some(out.worker))
    }
    Err(e) => {
      warn!("Failed to build metrics worker: {}. Falling back to no-op.", e);
      (MetricsCollector::noop(), None)
    }
  }
}
