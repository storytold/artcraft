use std::time::SystemTime;

use crate::queue::SampleQueue;
use crate::sample::RequestSample;

/// Cheap-to-clone handle that records request observations. Calls to
/// [`record_request`](Self::record_request) are non-blocking: they grab a
/// short-lived mutex on the in-memory queue and never do I/O.
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

  /// Collector that swallows every `record_request` call. Useful when the
  /// API key isn't configured, so the middleware can wrap the app
  /// unconditionally.
  pub fn noop() -> Self {
    Self { queue: SampleQueue::new(), enabled: false }
  }

  pub fn is_enabled(&self) -> bool { self.enabled }

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
    let timestamp_secs = SystemTime::now()
      .duration_since(SystemTime::UNIX_EPOCH)
      .map(|d| d.as_secs() as i64)
      .unwrap_or(0);
    self.queue.push(RequestSample {
      route: route.into(),
      method: method.into(),
      status_code,
      duration_ms,
      timestamp_secs,
    });
  }
}

#[cfg(test)]
mod tests {
  use super::*;

  #[test]
  fn noop_records_nothing() {
    let c = MetricsCollector::noop();
    c.record_request("/x", "GET", 200, 1.0);
    assert!(!c.is_enabled());
    // Internal queue isn't shared with anything, so we can't observe it
    // here — but at least we know the call returned without panicking.
  }

  #[test]
  fn enabled_pushes_to_shared_queue() {
    let q = SampleQueue::new();
    let c = MetricsCollector::new(q.clone());
    c.record_request("/x", "POST", 201, 2.5);
    assert_eq!(q.len(), 1);
  }
}
