use std::collections::HashMap;
use std::hash::Hash;

use chrono::{DateTime, Duration, Utc};

/// How to handle cache miss events, as dictated by the `CacheMissStrategizer`.
#[derive(Eq, PartialEq, Copy, Clone, Debug)]
pub enum CacheMissStrategy {
  /// Don't handle the cache miss right now.
  /// Wait or skip until told otherwise.
  WaitOrSkip,
  /// Handle the cache miss now.
  /// Do the download, calculation, whatever immediately.
  Proceed,
}

struct CacheMissLog {
  pub first_miss: DateTime<Utc>,
  pub most_recent_miss: DateTime<Utc>,
}

/// CacheMissStrategizer
///
/// This is the core component of the cold cache system.
///
/// Keep track of a cache and tell the caller when to proceed with work.
/// If it isn't time yet, skip or wait and let another consumer handle it.
pub struct CacheMissStrategizer<T: Hash + Eq> {
  /// How long it takes after the first cache miss to do work.
  max_cold_duration: Duration,

  /// How long it takes to reset the cold cache timer.
  /// eg. If we see a cache miss for X and then another one a day later,
  /// that shouldn't be cause to do work now.
  forget_duration: Duration,

  /// Log of all cache misses.
  cache_miss_log: HashMap<T, CacheMissLog>,

  /// Clock can be replaced for testing.
  get_time_function: Box<dyn Fn() -> DateTime<Utc>>,
}

impl CacheMissLog {
  fn new(first_miss: DateTime<Utc>) -> Self {
    Self {
      first_miss,
      most_recent_miss: first_miss,
    }
  }

  fn with_most_recent_miss(&self, most_recent_miss: DateTime<Utc>) -> Self {
    Self {
      first_miss: self.first_miss,
      most_recent_miss,
    }
  }
}

impl <T: Hash + Eq> CacheMissStrategizer<T> {
  pub fn new(max_cold_duration: Duration, forget_duration: Duration) -> Self {
    Self {
      max_cold_duration,
      forget_duration,
      cache_miss_log: HashMap::new(),
      get_time_function: Box::new(|| Utc::now()),
    }
  }

  pub fn new_for_testing(
    max_cold_duration: Duration,
    forget_duration: Duration,
    get_time_function: Box<dyn Fn() -> DateTime<Utc>>
  ) -> Self {
    Self {
      max_cold_duration,
      forget_duration,
      cache_miss_log: HashMap::new(),
      get_time_function,
    }
  }

  // NB: Not threadsafe due to multiple operations against hashes!
  #[must_use]
  pub fn cache_miss(&mut self, id: T) -> CacheMissStrategy {
    let now : DateTime<Utc> = (self.get_time_function)();

    if let Some((_id, cache_miss_log)) = self.cache_miss_log.get_key_value(&id) {
      let admit_duration = now.signed_duration_since(cache_miss_log.first_miss);
      let forget_duration = now.signed_duration_since(cache_miss_log.most_recent_miss);

      if forget_duration > self.forget_duration {
        // Too much time elapsed.
        // Treat this as essentially seeing the miss for the first time.
        let cache_miss_log = CacheMissLog::new(now);
        self.cache_miss_log.insert(id, cache_miss_log);
        CacheMissStrategy::WaitOrSkip
      }
      else if admit_duration > self.max_cold_duration {
        // We're done waiting. Do the work.
        self.cache_miss_log.remove(&id);
        CacheMissStrategy::Proceed
      }
      else {
        // Still waiting.
        let cache_miss_log = cache_miss_log.with_most_recent_miss(now);
        self.cache_miss_log.insert(id, cache_miss_log);
        CacheMissStrategy::WaitOrSkip
      }
    } else {
      let cache_miss_log = CacheMissLog::new(now);
      self.cache_miss_log.insert(id, cache_miss_log);
      CacheMissStrategy::WaitOrSkip
    }
  }

  // NB: Private; for testing only
  fn set_time_function(&mut self, get_time_function: Box<dyn Fn() -> DateTime<Utc>>) {
    self.get_time_function = get_time_function;
  }
}

#[cfg(test)]
mod tests {
  use chrono::{DateTime, Duration, Utc};

  use crate::{CacheMissStrategizer, CacheMissStrategy};

  fn get_date(datetime: &str) -> DateTime<Utc> {
    let datetime = DateTime::parse_from_rfc3339(datetime).unwrap();
    let utc : DateTime<Utc> = DateTime::from(datetime);
    utc
  }

  #[test]
  fn cold_cache_cache_miss_algorithm() {
    let mut cache_miss_strategizer = CacheMissStrategizer::new(
      Duration::seconds(10),
      Duration::seconds(60),
    );

    // First invocation
    cache_miss_strategizer.set_time_function(Box::new(|| get_date("2021-07-01T13:00:00+00:00")));
    assert_eq!(cache_miss_strategizer.cache_miss(10), CacheMissStrategy::WaitOrSkip);
    cache_miss_strategizer.set_time_function(Box::new(|| get_date("2021-07-01T13:00:01+00:00")));
    assert_eq!(cache_miss_strategizer.cache_miss(10), CacheMissStrategy::WaitOrSkip);
    cache_miss_strategizer.set_time_function(Box::new(|| get_date("2021-07-01T13:00:05+00:00")));
    assert_eq!(cache_miss_strategizer.cache_miss(10), CacheMissStrategy::WaitOrSkip);
    cache_miss_strategizer.set_time_function(Box::new(|| get_date("2021-07-01T13:00:10+00:00")));
    assert_eq!(cache_miss_strategizer.cache_miss(10), CacheMissStrategy::WaitOrSkip);
    // Final invocation after time expires. Proceed.
    cache_miss_strategizer.set_time_function(Box::new(|| get_date("2021-07-01T13:00:11+00:00")));
    assert_eq!(cache_miss_strategizer.cache_miss(10), CacheMissStrategy::Proceed);

    // New invocation.
    cache_miss_strategizer.set_time_function(Box::new(|| get_date("2021-07-01T13:00:15+00:00")));
    assert_eq!(cache_miss_strategizer.cache_miss(10), CacheMissStrategy::WaitOrSkip);
    cache_miss_strategizer.set_time_function(Box::new(|| get_date("2021-07-01T13:00:25+00:00")));
    // New ID.
    assert_eq!(cache_miss_strategizer.cache_miss(20), CacheMissStrategy::WaitOrSkip);
    // Old ID (still wait)
    assert_eq!(cache_miss_strategizer.cache_miss(10), CacheMissStrategy::WaitOrSkip);
    // Old ID is done, new ID is still waiting.
    cache_miss_strategizer.set_time_function(Box::new(|| get_date("2021-07-01T13:00:30+00:00")));
    assert_eq!(cache_miss_strategizer.cache_miss(10), CacheMissStrategy::Proceed);
    assert_eq!(cache_miss_strategizer.cache_miss(20), CacheMissStrategy::WaitOrSkip);
    // Now the new ID is also done.
    cache_miss_strategizer.set_time_function(Box::new(|| get_date("2021-07-01T13:00:41+00:00")));
    assert_eq!(cache_miss_strategizer.cache_miss(20), CacheMissStrategy::Proceed);

    // New Invocation
    cache_miss_strategizer.set_time_function(Box::new(|| get_date("2021-07-01T13:01:00+00:00")));
    assert_eq!(cache_miss_strategizer.cache_miss(30), CacheMissStrategy::WaitOrSkip);
    // We waited too long...
    cache_miss_strategizer.set_time_function(Box::new(|| get_date("2021-07-01T13:02:01+00:00")));
    assert_eq!(cache_miss_strategizer.cache_miss(30), CacheMissStrategy::WaitOrSkip);

    // New Invocation
    cache_miss_strategizer.set_time_function(Box::new(|| get_date("2021-07-01T13:04:00+00:00")));
    assert_eq!(cache_miss_strategizer.cache_miss(30), CacheMissStrategy::WaitOrSkip); // previously seen
    assert_eq!(cache_miss_strategizer.cache_miss(40), CacheMissStrategy::WaitOrSkip); // new
    // We waited just long enough before expiry
    cache_miss_strategizer.set_time_function(Box::new(|| get_date("2021-07-01T13:04:59+00:00")));
    assert_eq!(cache_miss_strategizer.cache_miss(30), CacheMissStrategy::Proceed);
    assert_eq!(cache_miss_strategizer.cache_miss(40), CacheMissStrategy::Proceed);
  }
}