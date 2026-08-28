use std::collections::HashMap;
use std::sync::{Arc, RwLock};
use std::time::{Duration, Instant};

/// Liveness signal for the job's long-running loops.
///
/// Each loop calls [`beat`](Self::beat) whenever it makes progress (an
/// iteration started, a page polled, an idle tick). The health check compares
/// the age of every registered heartbeat against a staleness threshold, so a
/// loop that is parked forever inside an await with no deadline — the failure
/// mode that previously went unnoticed for hours — turns the pod unhealthy and
/// lets Kubernetes restart it.
///
/// Cheaply [`Clone`]able: clones share the same underlying map.
#[derive(Clone)]
pub struct LoopHeartbeats {
  // NB: A std (sync) RwLock is intentional. Critical sections are tiny map
  // operations with no `.await` held across the guard.
  inner: Arc<RwLock<HashMap<&'static str, Instant>>>,
}

/// One loop's heartbeat age, as reported by the health check.
#[derive(Debug, Clone)]
pub struct HeartbeatAge {
  pub loop_name: &'static str,
  pub age: Duration,
}

impl LoopHeartbeats {
  pub fn new() -> Self {
    Self {
      inner: Arc::new(RwLock::new(HashMap::new())),
    }
  }

  /// Record that the named loop made progress just now. The first call for a
  /// name registers it; unregistered loops are never considered stale.
  pub fn beat(&self, loop_name: &'static str) {
    let mut map = self.inner.write().expect("loop heartbeats lock poisoned");
    map.insert(loop_name, Instant::now());
  }

  /// Age of every registered heartbeat, oldest first.
  pub fn ages(&self) -> Vec<HeartbeatAge> {
    let map = self.inner.read().expect("loop heartbeats lock poisoned");
    let now = Instant::now();

    let mut ages: Vec<HeartbeatAge> = map
        .iter()
        .map(|(loop_name, last_beat)| HeartbeatAge {
          loop_name,
          age: now.saturating_duration_since(*last_beat),
        })
        .collect();

    ages.sort_by(|a, b| b.age.cmp(&a.age));
    ages
  }

  /// Every registered loop whose last heartbeat is older than `threshold`.
  pub fn stale(&self, threshold: Duration) -> Vec<HeartbeatAge> {
    self.ages().into_iter().filter(|entry| entry.age > threshold).collect()
  }
}

impl Default for LoopHeartbeats {
  fn default() -> Self {
    Self::new()
  }
}

#[cfg(test)]
mod tests {
  use super::*;

  #[test]
  fn unregistered_loops_are_never_stale() {
    let heartbeats = LoopHeartbeats::new();
    assert!(heartbeats.stale(Duration::ZERO).is_empty());
  }

  #[test]
  fn fresh_beat_is_not_stale() {
    let heartbeats = LoopHeartbeats::new();
    heartbeats.beat("polling");
    assert!(heartbeats.stale(Duration::from_secs(60)).is_empty());
    assert_eq!(heartbeats.ages().len(), 1);
  }

  #[test]
  fn beat_older_than_threshold_is_stale() {
    let heartbeats = LoopHeartbeats::new();
    heartbeats.beat("polling");
    std::thread::sleep(Duration::from_millis(5));
    let stale = heartbeats.stale(Duration::from_millis(1));
    assert_eq!(stale.len(), 1);
    assert_eq!(stale[0].loop_name, "polling");
  }

  #[test]
  fn clones_share_state() {
    let heartbeats = LoopHeartbeats::new();
    let clone = heartbeats.clone();
    clone.beat("processing");
    assert_eq!(heartbeats.ages().len(), 1);
  }
}
