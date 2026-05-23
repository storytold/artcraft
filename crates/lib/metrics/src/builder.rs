use std::sync::Arc;
use std::sync::atomic::AtomicBool;
use std::time::Duration;

use datadog_client::client::DatadogClient;

use crate::collector::MetricsCollector;
use crate::queue::SampleQueue;
use crate::worker::{MetricsWorker, MetricsWorkerConfig};

pub const DEFAULT_FLUSH_INTERVAL_SECS: u64 = 10;
pub const DEFAULT_DURATION_METRIC: &str = "http.server.request.duration_ms";
pub const DEFAULT_COUNT_METRIC: &str = "http.server.request.count";

pub struct MetricsBuilder {
  client: Option<DatadogClient>,
  flush_interval: Duration,
  duration_metric_name: String,
  count_metric_name: String,
  host: Option<String>,
  env: Option<String>,
  service_name: Option<String>,
  max_buffered_samples: Option<usize>,
}

impl MetricsBuilder {
  pub fn new() -> Self {
    Self {
      client: None,
      flush_interval: Duration::from_secs(DEFAULT_FLUSH_INTERVAL_SECS),
      duration_metric_name: DEFAULT_DURATION_METRIC.to_string(),
      count_metric_name: DEFAULT_COUNT_METRIC.to_string(),
      host: None,
      env: None,
      service_name: None,
      max_buffered_samples: None,
    }
  }

  pub fn datadog_client(mut self, client: DatadogClient) -> Self {
    self.client = Some(client); self
  }

  pub fn flush_interval(mut self, interval: Duration) -> Self {
    self.flush_interval = interval; self
  }

  pub fn duration_metric_name(mut self, name: impl Into<String>) -> Self {
    self.duration_metric_name = name.into(); self
  }

  pub fn count_metric_name(mut self, name: impl Into<String>) -> Self {
    self.count_metric_name = name.into(); self
  }

  pub fn host(mut self, host: impl Into<String>) -> Self {
    self.host = Some(host.into()); self
  }

  pub fn env(mut self, env: impl Into<String>) -> Self {
    self.env = Some(env.into()); self
  }

  pub fn service_name(mut self, name: impl Into<String>) -> Self {
    self.service_name = Some(name.into()); self
  }

  pub fn max_buffered_samples(mut self, n: usize) -> Self {
    self.max_buffered_samples = Some(n); self
  }

  /// Build the (collector, worker) pair plus a shutdown flag. Spawn
  /// `worker.run()` on a long-lived tokio task; clone `collector` into
  /// middleware/handlers; call `shutdown.store(true, Ordering::Relaxed)`
  /// to drain the worker on graceful shutdown.
  ///
  /// Returns `Err` only if no Datadog client was provided. Callers that
  /// want to disable metrics should use [`MetricsCollector::noop`] instead.
  pub fn build(self) -> Result<BuildOutput, String> {
    let client = self.client
      .ok_or_else(|| "MetricsBuilder: datadog_client is required".to_string())?;

    let queue = match self.max_buffered_samples {
      Some(n) => SampleQueue::with_capacity(n),
      None => SampleQueue::new(),
    };
    let shutdown = Arc::new(AtomicBool::new(false));

    let config = MetricsWorkerConfig {
      flush_interval: self.flush_interval,
      duration_metric_name: self.duration_metric_name,
      count_metric_name: self.count_metric_name,
      host: self.host,
      env: self.env.unwrap_or_else(|| "unknown".to_string()),
      service_name: self.service_name.unwrap_or_else(|| "unknown".to_string()),
    };

    let collector = MetricsCollector::new(queue.clone());
    let worker = MetricsWorker::new(queue, client, config, shutdown.clone());

    Ok(BuildOutput { collector, worker, shutdown })
  }
}

impl Default for MetricsBuilder {
  fn default() -> Self { Self::new() }
}

pub struct BuildOutput {
  pub collector: MetricsCollector,
  pub worker: MetricsWorker,
  pub shutdown: Arc<AtomicBool>,
}
