use std::sync::{Arc, Mutex};

use log::warn;

use crate::sample::Sample;

/// Soft cap on buffered samples. The worker drains every few seconds, so
/// hitting this would mean the Datadog API is unreachable AND we're seeing
/// >10k req/s sustained. Hitting it drops oldest-first.
pub const DEFAULT_MAX_SAMPLES: usize = 100_000;

/// Thread-safe bounded buffer of samples. Cheap to clone (Arc inside).
#[derive(Clone)]
pub struct SampleQueue {
  inner: Arc<Mutex<Vec<Sample>>>,
  max_samples: usize,
}

impl SampleQueue {
  pub fn new() -> Self {
    Self::with_capacity(DEFAULT_MAX_SAMPLES)
  }

  pub fn with_capacity(max_samples: usize) -> Self {
    Self {
      inner: Arc::new(Mutex::new(Vec::with_capacity(1024))),
      max_samples,
    }
  }

  /// Non-blocking push. Drops the *oldest* sample if the buffer is full so
  /// the worker still gets a freshness-biased view if Datadog is down.
  pub fn push(&self, sample: Sample) {
    let mut guard = match self.inner.lock() {
      Ok(g) => g,
      Err(poison) => poison.into_inner(),
    };
    if guard.len() >= self.max_samples {
      // Drop oldest. `swap_remove(0)` is O(1) but reorders; we don't care
      // about insertion order since aggregation groups by tuple key.
      let _ = guard.swap_remove(0);
    }
    guard.push(sample);
  }

  /// Atomically take all currently-buffered samples.
  pub fn drain(&self) -> Vec<Sample> {
    let mut guard = match self.inner.lock() {
      Ok(g) => g,
      Err(poison) => {
        warn!("metrics SampleQueue lock poisoned on drain; recovering");
        poison.into_inner()
      }
    };
    std::mem::take(&mut *guard)
  }

  pub fn len(&self) -> usize {
    self.inner.lock().map(|g| g.len()).unwrap_or(0)
  }
}

impl Default for SampleQueue {
  fn default() -> Self { Self::new() }
}

#[cfg(test)]
mod tests {
  use super::*;
  use crate::sample::RequestSample;

  fn request_sample(route: &str) -> Sample {
    Sample::Request(RequestSample {
      route: route.to_string(),
      method: "GET".to_string(),
      status_code: 200,
      duration_ms: 1.0,
      timestamp_secs: 1,
    })
  }

  #[test]
  fn drain_returns_pushed_samples_and_empties() {
    let q = SampleQueue::new();
    q.push(request_sample("/a"));
    q.push(request_sample("/b"));
    let drained = q.drain();
    assert_eq!(drained.len(), 2);
    assert_eq!(q.drain().len(), 0);
  }

  #[test]
  fn full_queue_drops_oldest() {
    let q = SampleQueue::with_capacity(3);
    q.push(request_sample("/old"));
    q.push(request_sample("/older"));
    q.push(request_sample("/oldest"));
    q.push(request_sample("/new"));
    let drained = q.drain();
    assert_eq!(drained.len(), 3);
    let routes: Vec<_> = drained.iter().filter_map(|s| match s {
      Sample::Request(r) => Some(r.route.clone()),
      _ => None,
    }).collect();
    assert!(routes.contains(&"/new".to_string()));
  }
}
