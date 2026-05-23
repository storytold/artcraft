use std::collections::HashMap;
use std::sync::Arc;
use std::sync::atomic::{AtomicBool, Ordering};
use std::time::Duration;

use std::time::{SystemTime, UNIX_EPOCH};

use log::{error, info, warn};

use datadog_client::client::{
  DatadogClient, DistributionPoint, DistributionSeries, MetricPoint, MetricSeries,
};

use crate::queue::SampleQueue;
use crate::sample::{CounterSample, ObservationSample, RequestSample, Sample};

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
/// each sample kind, and POST to Datadog. Stops when the shared `shutdown`
/// flag is set and flushes one final batch on the way out.
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

  pub async fn run(&self) {
    info!(
      "Metrics worker started (flush every {:?}, service={}, env={}, host={})",
      self.config.flush_interval,
      self.config.service_name,
      self.config.env,
      self.config.host.as_deref().unwrap_or("<unset>"),
    );

    // Startup connectivity ping: submit one tiny counter so logs immediately
    // reveal misconfigured API keys / blocked egress / etc., rather than
    // staying silent until the first batch with real data flushes.
    self.startup_ping().await;

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

  /// One-shot at worker startup. Submits a single `metrics.startup.ping`
  /// counter so failures (bad API key, no egress, wrong DD site) surface
  /// in the logs within seconds of boot.
  async fn startup_ping(&self) {
    let now = SystemTime::now()
      .duration_since(UNIX_EPOCH)
      .map(|d| d.as_secs() as i64)
      .unwrap_or(0);
    let ping = MetricSeries {
      metric: "metrics.startup.ping".to_string(),
      points: vec![MetricPoint(now, 1.0)],
      metric_type: "count".to_string(),
      tags: vec![
        format!("env:{}", self.config.env),
        format!("service:{}", self.config.service_name),
      ],
      host: self.config.host.clone(),
      interval: Some(60),
    };
    match self.client.submit_series(vec![ping]).await {
      Ok(()) => info!(
        "metrics: startup ping submitted successfully (service={}, env={})",
        self.config.service_name, self.config.env,
      ),
      Err(e) => error!(
        "metrics: startup ping FAILED ({}). The worker will keep trying, but \
         this almost always means a misconfigured DATADOG_API_KEY, a wrong \
         Datadog site host, or blocked egress to api.datadoghq.com.",
        e,
      ),
    }
  }

  async fn flush_once(&self) {
    let samples = self.queue.drain();
    if samples.is_empty() {
      return;
    }
    let sample_count = samples.len();
    let MetricsBuild { distributions, counts } = self.build_metrics(samples);
    let dist_count = distributions.len();
    let count_count = counts.len();

    let dist_result = self.client.submit_distribution_points(distributions).await;
    let series_result = self.client.submit_series(counts).await;

    match (&dist_result, &series_result) {
      (Ok(()), Ok(())) => {
        info!(
          "metrics flush ok: {} samples → {} distribution series, {} count series",
          sample_count, dist_count, count_count,
        );
      }
      _ => {
        if let Err(e) = dist_result {
          warn!(
            "metrics: distribution submission FAILED ({} series, {} samples): {}",
            dist_count, sample_count, e,
          );
        }
        if let Err(e) = series_result {
          warn!(
            "metrics: series submission FAILED ({} series, {} samples): {}",
            count_count, sample_count, e,
          );
        }
      }
    }
  }

  /// Partition samples by kind and aggregate each:
  /// - Request samples → per `(route, method, status_code)`: distribution of
  ///   duration_ms + count.
  /// - Counter samples → per `(metric, sorted_tags)`: count (entry count
  ///   in that group).
  /// - Observation samples → per `(metric, sorted_tags)`: distribution of
  ///   values.
  fn build_metrics(&self, samples: Vec<Sample>) -> MetricsBuild {
    let mut requests = Vec::new();
    let mut counters = Vec::new();
    let mut observations = Vec::new();
    for s in samples {
      match s {
        Sample::Request(r) => requests.push(r),
        Sample::Counter(c) => counters.push(c),
        Sample::Observation(o) => observations.push(o),
      }
    }

    let interval = self.config.flush_interval.as_secs() as i64;
    let mut distributions = Vec::new();
    let mut counts = Vec::new();

    self.build_request_metrics(requests, interval, &mut distributions, &mut counts);
    self.build_counter_metrics(counters, interval, &mut counts);
    self.build_observation_metrics(observations, &mut distributions);

    MetricsBuild { distributions, counts }
  }

  fn build_request_metrics(
    &self,
    samples: Vec<RequestSample>,
    interval: i64,
    distributions: &mut Vec<DistributionSeries>,
    counts: &mut Vec<MetricSeries>,
  ) {
    let mut by_key: HashMap<RequestKey, RequestBucket> = HashMap::new();
    for s in samples {
      let key = RequestKey { route: s.route, method: s.method, status_code: s.status_code };
      let bucket = by_key.entry(key).or_insert_with(|| RequestBucket {
        durations_ms: Vec::new(),
        last_timestamp_secs: s.timestamp_secs,
      });
      bucket.durations_ms.push(s.duration_ms);
      if s.timestamp_secs > bucket.last_timestamp_secs {
        bucket.last_timestamp_secs = s.timestamp_secs;
      }
    }

    for (key, bucket) in by_key {
      let tags = self.build_request_tags(&key);
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
  }

  fn build_counter_metrics(
    &self,
    samples: Vec<CounterSample>,
    interval: i64,
    counts: &mut Vec<MetricSeries>,
  ) {
    let mut by_key: HashMap<(String, Vec<String>), CounterBucket> = HashMap::new();
    for s in samples {
      let tags = sort_tags(s.tags);
      let entry = by_key.entry((s.metric, tags)).or_insert_with(|| CounterBucket {
        value: 0.0,
        last_timestamp_secs: s.timestamp_secs,
      });
      entry.value += 1.0;
      if s.timestamp_secs > entry.last_timestamp_secs {
        entry.last_timestamp_secs = s.timestamp_secs;
      }
    }
    for ((metric, tags), bucket) in by_key {
      counts.push(MetricSeries {
        metric,
        points: vec![MetricPoint(bucket.last_timestamp_secs, bucket.value)],
        metric_type: "count".to_string(),
        tags: with_service_env_tags(tags, &self.config),
        host: self.config.host.clone(),
        interval: Some(interval),
      });
    }
  }

  fn build_observation_metrics(
    &self,
    samples: Vec<ObservationSample>,
    distributions: &mut Vec<DistributionSeries>,
  ) {
    let mut by_key: HashMap<(String, Vec<String>), ObservationBucket> = HashMap::new();
    for s in samples {
      let tags = sort_tags(s.tags);
      let entry = by_key.entry((s.metric, tags)).or_insert_with(|| ObservationBucket {
        values: Vec::new(),
        last_timestamp_secs: s.timestamp_secs,
      });
      entry.values.push(s.value);
      if s.timestamp_secs > entry.last_timestamp_secs {
        entry.last_timestamp_secs = s.timestamp_secs;
      }
    }
    for ((metric, tags), bucket) in by_key {
      distributions.push(DistributionSeries {
        metric,
        points: vec![DistributionPoint(bucket.last_timestamp_secs, bucket.values)],
        tags: with_service_env_tags(tags, &self.config),
        host: self.config.host.clone(),
      });
    }
  }

  fn build_request_tags(&self, key: &RequestKey) -> Vec<String> {
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
struct RequestKey {
  route: String,
  method: String,
  status_code: u16,
}

struct RequestBucket {
  durations_ms: Vec<f64>,
  last_timestamp_secs: i64,
}

struct CounterBucket {
  value: f64,
  last_timestamp_secs: i64,
}

struct ObservationBucket {
  values: Vec<f64>,
  last_timestamp_secs: i64,
}

struct MetricsBuild {
  distributions: Vec<DistributionSeries>,
  counts: Vec<MetricSeries>,
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

/// Sort so `(metric, tags)` keys hash the same regardless of caller ordering.
fn sort_tags(mut tags: Vec<String>) -> Vec<String> {
  tags.sort();
  tags.dedup();
  tags
}

/// Append the service/env tags to a custom-metric tag list (after dedup),
/// matching what request metrics get for free.
fn with_service_env_tags(mut tags: Vec<String>, config: &MetricsWorkerConfig) -> Vec<String> {
  tags.push(format!("env:{}", config.env));
  tags.push(format!("service:{}", config.service_name));
  tags
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

  mod request_aggregation {
    use super::*;

    fn sample(route: &str, method: &str, status: u16, dur: f64, ts: i64) -> Sample {
      Sample::Request(RequestSample {
        route: route.to_string(),
        method: method.to_string(),
        status_code: status,
        duration_ms: dur,
        timestamp_secs: ts,
      })
    }

    #[test]
    fn groups_by_route_method_status() {
      let w = make_worker();
      let samples = vec![
        sample("/a", "GET", 200, 1.0, 100),
        sample("/a", "GET", 200, 2.0, 110),
        sample("/a", "GET", 500, 9.0, 120),
        sample("/b", "POST", 201, 5.0, 130),
      ];
      let build = w.build_metrics(samples);
      assert_eq!(build.distributions.len(), 3);
      assert_eq!(build.counts.len(), 3);
      let a_200 = build.distributions.iter()
        .find(|d| d.tags.iter().any(|t| t == "route:/a")
                && d.tags.iter().any(|t| t == "status_code:200"))
        .expect("missing /a 200 series");
      assert_eq!(a_200.points[0].1, vec![1.0, 2.0]);
    }

    #[test]
    fn tags_include_class_env_service() {
      let w = make_worker();
      let samples = vec![sample("/x", "GET", 500, 1.0, 1)];
      let build = w.build_metrics(samples);
      let tags = &build.distributions[0].tags;
      assert!(tags.contains(&"status_class:5xx".to_string()));
      assert!(tags.contains(&"env:test".to_string()));
      assert!(tags.contains(&"service:test-service".to_string()));
    }

    #[test]
    fn count_series_uses_count_type_and_interval() {
      let w = make_worker();
      let samples = vec![sample("/x", "GET", 200, 1.0, 1)];
      let build = w.build_metrics(samples);
      assert_eq!(build.counts[0].metric_type, "count");
      assert_eq!(build.counts[0].interval, Some(10));
      assert_eq!(build.counts[0].points[0].1, 1.0);
    }
  }

  mod counter_aggregation {
    use super::*;

    fn counter(metric: &str, tags: Vec<&str>, ts: i64) -> Sample {
      Sample::Counter(CounterSample {
        metric: metric.to_string(),
        tags: tags.into_iter().map(|s| s.to_string()).collect(),
        timestamp_secs: ts,
      })
    }

    #[test]
    fn groups_by_metric_and_tag_set() {
      let w = make_worker();
      let samples = vec![
        counter("orders.placed", vec!["region:us"], 1),
        counter("orders.placed", vec!["region:us"], 2),
        counter("orders.placed", vec!["region:eu"], 3),
        counter("orders.failed", vec!["region:us"], 4),
      ];
      let build = w.build_metrics(samples);
      assert_eq!(build.distributions.len(), 0);
      assert_eq!(build.counts.len(), 3);
      let us_placed = build.counts.iter().find(|m| {
        m.metric == "orders.placed"
          && m.tags.iter().any(|t| t == "region:us")
      }).expect("missing orders.placed/us");
      assert_eq!(us_placed.points[0].1, 2.0);
    }

    #[test]
    fn tag_order_does_not_split_groups() {
      let w = make_worker();
      let samples = vec![
        counter("x", vec!["a:1", "b:2"], 1),
        counter("x", vec!["b:2", "a:1"], 2),
      ];
      let build = w.build_metrics(samples);
      assert_eq!(build.counts.len(), 1);
      assert_eq!(build.counts[0].points[0].1, 2.0);
    }

    #[test]
    fn service_and_env_tags_appended() {
      let w = make_worker();
      let samples = vec![counter("foo", vec![], 1)];
      let build = w.build_metrics(samples);
      let tags = &build.counts[0].tags;
      assert!(tags.contains(&"env:test".to_string()));
      assert!(tags.contains(&"service:test-service".to_string()));
    }
  }

  mod observation_aggregation {
    use super::*;

    fn obs(metric: &str, value: f64, tags: Vec<&str>, ts: i64) -> Sample {
      Sample::Observation(ObservationSample {
        metric: metric.to_string(),
        value,
        tags: tags.into_iter().map(|s| s.to_string()).collect(),
        timestamp_secs: ts,
      })
    }

    #[test]
    fn groups_into_distributions() {
      let w = make_worker();
      let samples = vec![
        obs("queue.depth", 10.0, vec!["queue:a"], 1),
        obs("queue.depth", 20.0, vec!["queue:a"], 2),
        obs("queue.depth", 30.0, vec!["queue:b"], 3),
      ];
      let build = w.build_metrics(samples);
      assert_eq!(build.distributions.len(), 2);
      assert_eq!(build.counts.len(), 0);
      let a = build.distributions.iter()
        .find(|d| d.tags.iter().any(|t| t == "queue:a"))
        .expect("missing queue:a series");
      assert_eq!(a.points[0].1, vec![10.0, 20.0]);
    }

    #[test]
    fn service_and_env_tags_appended() {
      let w = make_worker();
      let samples = vec![obs("foo", 1.0, vec![], 1)];
      let build = w.build_metrics(samples);
      let tags = &build.distributions[0].tags;
      assert!(tags.contains(&"env:test".to_string()));
      assert!(tags.contains(&"service:test-service".to_string()));
    }
  }
}
