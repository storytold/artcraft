use std::time::SystemTime;

use crate::queue::SampleQueue;
use crate::sample::{CounterSample, ObservationSample, RequestSample, Sample};

/// Cheap-to-clone handle that records metric observations. All `record_*`
/// methods are non-blocking: they grab a short-lived mutex on the in-memory
/// queue and never do I/O.
///
/// Built via [`crate::builder::MetricsBuilder`]. Use [`Self::noop()`] when
/// metrics should be disabled (no Datadog API key configured, dev env, …).
#[derive(Clone)]
pub struct MetricsCollector {
  queue: SampleQueue,
  enabled: bool,
}

impl MetricsCollector {
  pub(crate) fn new(queue: SampleQueue) -> Self {
    Self { queue, enabled: true }
  }

  /// Collector that swallows every recording call. Use when no API key is
  /// configured, so callers can wire the collector unconditionally.
  pub fn noop() -> Self {
    Self { queue: SampleQueue::new(), enabled: false }
  }

  pub fn is_enabled(&self) -> bool { self.enabled }

  // ==================== Request observations ====================

  /// Record one HTTP request observation. Called by the actix middleware.
  pub fn record_request(
    &self,
    route: impl Into<String>,
    method: impl Into<String>,
    status_code: u16,
    duration_ms: f64,
  ) {
    if !self.enabled {
      return;
    }
    self.queue.push(Sample::Request(RequestSample {
      route: route.into(),
      method: method.into(),
      status_code,
      duration_ms,
      timestamp_secs: now_secs(),
    }));
  }

  // ==================== Custom counters ====================

  /// Increment a custom counter metric by 1. Emitted to Datadog as `count`
  /// (with the worker's `flush_interval` as the rollup interval). Tags are
  /// shipped verbatim — keep their cardinality bounded.
  pub fn increment(&self, metric: impl Into<String>, tags: Vec<String>) {
    self.add(metric, 1, tags);
  }

  /// Add `value` to a custom counter metric. Use [`Self::increment`] for the
  /// common +1 case.
  pub fn add(&self, metric: impl Into<String>, value: u64, tags: Vec<String>) {
    if !self.enabled || value == 0 {
      return;
    }
    let metric = metric.into();
    let timestamp_secs = now_secs();
    // We model `add(n)` as n increments of the same `(metric, tags)`
    // bucket. The worker counts entries per group; emitting n separate
    // samples keeps the aggregation logic uniform.
    for _ in 0..value {
      self.queue.push(Sample::Counter(CounterSample {
        metric: metric.clone(),
        tags: tags.clone(),
        timestamp_secs,
      }));
    }
  }

  // ==================== Custom observations ====================

  /// Record a single observation (`f64`) for a distribution metric. Datadog
  /// will compute p50/p75/p90/p95/p99/avg/min/max/count server-side.
  pub fn observe(&self, metric: impl Into<String>, value: f64, tags: Vec<String>) {
    if !self.enabled {
      return;
    }
    self.queue.push(Sample::Observation(ObservationSample {
      metric: metric.into(),
      value,
      tags,
      timestamp_secs: now_secs(),
    }));
  }
}

fn now_secs() -> i64 {
  SystemTime::now()
    .duration_since(SystemTime::UNIX_EPOCH)
    .map(|d| d.as_secs() as i64)
    .unwrap_or(0)
}

#[cfg(test)]
mod tests {
  use super::*;

  mod request_path {
    use super::*;

    #[test]
    fn noop_records_nothing() {
      let c = MetricsCollector::noop();
      c.record_request("/x", "GET", 200, 1.0);
      assert!(!c.is_enabled());
    }

    #[test]
    fn enabled_pushes_to_shared_queue() {
      let q = SampleQueue::new();
      let c = MetricsCollector::new(q.clone());
      c.record_request("/x", "POST", 201, 2.5);
      assert_eq!(q.len(), 1);
    }
  }

  mod counter_path {
    use super::*;

    #[test]
    fn increment_pushes_one_counter_sample() {
      let q = SampleQueue::new();
      let c = MetricsCollector::new(q.clone());
      c.increment("my.metric", vec!["a:b".to_string()]);
      assert_eq!(q.len(), 1);
      match &q.drain()[0] {
        Sample::Counter(c) => {
          assert_eq!(c.metric, "my.metric");
          assert_eq!(c.tags, vec!["a:b".to_string()]);
        }
        other => panic!("expected Counter, got {:?}", other),
      }
    }

    #[test]
    fn add_emits_n_samples() {
      let q = SampleQueue::new();
      let c = MetricsCollector::new(q.clone());
      c.add("my.metric", 5, vec![]);
      assert_eq!(q.len(), 5);
    }

    #[test]
    fn add_zero_is_noop() {
      let q = SampleQueue::new();
      let c = MetricsCollector::new(q.clone());
      c.add("my.metric", 0, vec![]);
      assert_eq!(q.len(), 0);
    }

    #[test]
    fn noop_collector_ignores_counters() {
      let c = MetricsCollector::noop();
      c.increment("x", vec![]);
      c.add("x", 5, vec![]);
    }
  }

  mod observation_path {
    use super::*;

    #[test]
    fn observe_pushes_observation_sample() {
      let q = SampleQueue::new();
      let c = MetricsCollector::new(q.clone());
      c.observe("my.dist", 3.14, vec!["k:v".to_string()]);
      assert_eq!(q.len(), 1);
      match &q.drain()[0] {
        Sample::Observation(o) => {
          assert_eq!(o.metric, "my.dist");
          assert_eq!(o.value, 3.14);
          assert_eq!(o.tags, vec!["k:v".to_string()]);
        }
        other => panic!("expected Observation, got {:?}", other),
      }
    }

    #[test]
    fn noop_collector_ignores_observations() {
      let c = MetricsCollector::noop();
      c.observe("x", 1.0, vec![]);
    }
  }
}
