use std::collections::HashMap;
use std::sync::Arc;
use std::sync::atomic::{AtomicBool, Ordering};
use std::time::Duration;

use log::{debug, info, warn};

use datadog_client::client::{
  DatadogClient, DistributionPoint, DistributionSeries, MetricPoint, MetricSeries,
};

use crate::queue::SampleQueue;
use crate::sample::RequestSample;

#[derive(Clone)]
pub struct MetricsWorkerConfig {
  pub flush_interval: Duration,
  pub duration_metric_name: String,
  pub count_metric_name: String,
  pub host: Option<String>,
  pub env: String,
  pub service_name: String,
}

/// Long-lived async loop: every `flush_interval`, drain the queue, aggregate
/// by `(route, method, status_code)`, and submit two POSTs to Datadog (one
/// distribution + one series). Stops when the shared `shutdown` flag is set.
pub struct MetricsWorker {
  queue: SampleQueue,
  client: DatadogClient,
  config: MetricsWorkerConfig,
  shutdown: Arc<AtomicBool>,
}

impl MetricsWorker {
  pub(crate) fn new(
    queue: SampleQueue,
    client: DatadogClient,
    config: MetricsWorkerConfig,
    shutdown: Arc<AtomicBool>,
  ) -> Self {
    Self { queue, client, config, shutdown }
  }

  pub fn shutdown_handle(&self) -> Arc<AtomicBool> {
    self.shutdown.clone()
  }

  /// Run the main loop. Intended to be `tokio::spawn`'d.
  pub async fn run(&self) {
    info!(
      "Metrics worker started (flush every {:?}, service={}, env={})",
      self.config.flush_interval, self.config.service_name, self.config.env,
    );

    let mut ticker = tokio::time::interval(self.config.flush_interval);
    // `tokio::time::interval` fires immediately on the first tick; skip it
    // so we don't flush a half-empty bucket the moment we boot.
    ticker.tick().await;

    while !self.shutdown.load(Ordering::Relaxed) {
      ticker.tick().await;
      if self.shutdown.load(Ordering::Relaxed) { break; }
      self.flush_once().await;
    }

    info!("Metrics worker draining final batch on shutdown");
    self.flush_once().await;
    info!("Metrics worker stopped");
  }

  async fn flush_once(&self) {
    let samples = self.queue.drain();
    if samples.is_empty() {
      return;
    }
    let sample_count = samples.len();
    let (distributions, counts) = self.build_metrics(samples);
    debug!(
      "metrics flush: {} samples → {} distribution series, {} count series",
      sample_count, distributions.len(), counts.len(),
    );

    if let Err(e) = self.client.submit_distribution_points(distributions).await {
      warn!("metrics: distribution submission failed: {}", e);
    }
    if let Err(e) = self.client.submit_series(counts).await {
      warn!("metrics: series submission failed: {}", e);
    }
  }

  /// Group samples by `(route, method, status_code)` into two output sets:
  /// per-group distributions (raw duration_ms values) + per-group counters.
  fn build_metrics(
    &self,
    samples: Vec<RequestSample>,
  ) -> (Vec<DistributionSeries>, Vec<MetricSeries>) {
    let mut by_key: HashMap<GroupKey, Bucket> = HashMap::new();

    for s in samples {
      let key = GroupKey {
        route: s.route,
        method: s.method,
        status_code: s.status_code,
      };
      let bucket = by_key.entry(key).or_insert_with(|| Bucket {
        durations_ms: Vec::new(),
        last_timestamp_secs: s.timestamp_secs,
      });
      bucket.durations_ms.push(s.duration_ms);
      if s.timestamp_secs > bucket.last_timestamp_secs {
        bucket.last_timestamp_secs = s.timestamp_secs;
      }
    }

    let interval = self.config.flush_interval.as_secs() as i64;
    let mut distributions = Vec::with_capacity(by_key.len());
    let mut counts = Vec::with_capacity(by_key.len());

    for (key, bucket) in by_key {
      let tags = self.build_tags(&key);
      let count = bucket.durations_ms.len() as f64;

      distributions.push(DistributionSeries {
        metric: self.config.duration_metric_name.clone(),
        points: vec![DistributionPoint(bucket.last_timestamp_secs, bucket.durations_ms)],
        tags: tags.clone(),
        host: self.config.host.clone(),
      });

      counts.push(MetricSeries {
        metric: self.config.count_metric_name.clone(),
        points: vec![MetricPoint(bucket.last_timestamp_secs, count)],
        metric_type: "count".to_string(),
        tags,
        host: self.config.host.clone(),
        interval: Some(interval),
      });
    }

    (distributions, counts)
  }

  fn build_tags(&self, key: &GroupKey) -> Vec<String> {
    let class = status_class(key.status_code);
    vec![
      format!("route:{}", key.route),
      format!("method:{}", key.method),
      format!("status_code:{}", key.status_code),
      format!("status_class:{}", class),
      format!("env:{}", self.config.env),
      format!("service:{}", self.config.service_name),
    ]
  }
}

#[derive(Eq, Hash, PartialEq)]
struct GroupKey {
  route: String,
  method: String,
  status_code: u16,
}

struct Bucket {
  durations_ms: Vec<f64>,
  last_timestamp_secs: i64,
}

fn status_class(status: u16) -> &'static str {
  match status {
    100..=199 => "1xx",
    200..=299 => "2xx",
    300..=399 => "3xx",
    400..=499 => "4xx",
    _ => "5xx",
  }
}

#[cfg(test)]
mod tests {
  use super::*;

  fn make_worker() -> MetricsWorker {
    let queue = SampleQueue::new();
    let client = DatadogClient::new(datadog_client::creds::DatadogApiKey::new("test"));
    let config = MetricsWorkerConfig {
      flush_interval: Duration::from_secs(10),
      duration_metric_name: "test.duration_ms".to_string(),
      count_metric_name: "test.count".to_string(),
      host: Some("test-host".to_string()),
      env: "test".to_string(),
      service_name: "test-service".to_string(),
    };
    MetricsWorker::new(queue, client, config, Arc::new(AtomicBool::new(false)))
  }

  mod status_class_tests {
    use super::*;

    #[test]
    fn classifies_each_range() {
      assert_eq!(status_class(100), "1xx");
      assert_eq!(status_class(200), "2xx");
      assert_eq!(status_class(299), "2xx");
      assert_eq!(status_class(301), "3xx");
      assert_eq!(status_class(404), "4xx");
      assert_eq!(status_class(500), "5xx");
      assert_eq!(status_class(0),   "5xx");
    }
  }

  mod build_metrics_tests {
    use super::*;

    fn sample(route: &str, method: &str, status: u16, dur: f64, ts: i64) -> RequestSample {
      RequestSample {
        route: route.to_string(),
        method: method.to_string(),
        status_code: status,
        duration_ms: dur,
        timestamp_secs: ts,
      }
    }

    #[test]
    fn groups_by_route_method_status() {
      let worker = make_worker();
      let samples = vec![
        sample("/a", "GET", 200, 1.0, 100),
        sample("/a", "GET", 200, 2.0, 110),
        sample("/a", "GET", 500, 9.0, 120),
        sample("/b", "POST", 201, 5.0, 130),
      ];
      let (dists, counts) = worker.build_metrics(samples);
      assert_eq!(dists.len(), 3);
      assert_eq!(counts.len(), 3);

      let a_200 = dists.iter()
        .find(|d| d.tags.iter().any(|t| t == "route:/a")
              && d.tags.iter().any(|t| t == "status_code:200"))
        .expect("missing /a 200 series");
      assert_eq!(a_200.points.len(), 1);
      assert_eq!(a_200.points[0].1, vec![1.0, 2.0]);
    }

    #[test]
    fn tags_include_class_env_service() {
      let worker = make_worker();
      let samples = vec![sample("/x", "GET", 500, 1.0, 1)];
      let (dists, _) = worker.build_metrics(samples);
      let tags = &dists[0].tags;
      assert!(tags.contains(&"status_class:5xx".to_string()));
      assert!(tags.contains(&"env:test".to_string()));
      assert!(tags.contains(&"service:test-service".to_string()));
    }

    #[test]
    fn count_series_uses_count_type_and_interval() {
      let worker = make_worker();
      let samples = vec![sample("/x", "GET", 200, 1.0, 1)];
      let (_, counts) = worker.build_metrics(samples);
      assert_eq!(counts[0].metric_type, "count");
      assert_eq!(counts[0].interval, Some(10));
      assert_eq!(counts[0].points[0].1, 1.0);
    }
  }
}
